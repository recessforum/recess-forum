import { promises as fs } from "fs";
import path from "path";
import type { Comment, Post } from "./types";
import { SEED_COMMENTS, SEED_POSTS } from "./seed";

/**
 * Temporary persistence layer standing in for a real database (see handoff
 * §2/§10 — item 2 in the priority build order; auth from item 1 has landed
 * via Supabase, but posts/comments/votes/views live here until the DB swap).
 * Backed by a JSON file instead of `window.storage` so data survives server
 * restarts and is shared across browser sessions. Vote/view dedup is keyed
 * by the real authenticated Supabase userId now (not an anonymous cookie),
 * so this shape maps directly onto `schema.sql`'s `votes`/`post_views`
 * tables when the swap happens. Expert applications moved to Supabase
 * directly (real per-user table with RLS) since that data is already
 * cleanly user-scoped — see app/api/expert-applications/route.ts.
 */

interface DB {
  posts: Post[];
  comments: Record<string, Comment[]>;
  votes: Record<string, Record<string, 1 | -1>>; // `${targetType}:${targetId}` -> voterId -> dir
  viewedBy: Record<string, string[]>; // postId -> voterIds who've counted a view
}

const DB_PATH = path.join(process.cwd(), ".data", "db.json");

function seedDB(): DB {
  return {
    posts: SEED_POSTS,
    comments: SEED_COMMENTS,
    votes: {},
    viewedBy: {},
  };
}

let writeChain: Promise<unknown> = Promise.resolve();

async function readDB(): Promise<DB> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(raw) as DB;
  } catch {
    const seeded = seedDB();
    await writeDB(seeded);
    return seeded;
  }
}

async function writeDB(db: DB): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

/** Serializes read-modify-write cycles so concurrent requests don't clobber each other. */
function withDB<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = writeChain.then(async () => {
    const db = await readDB();
    const result = await fn(db);
    await writeDB(db);
    return result;
  });
  writeChain = run.catch(() => {});
  return run;
}

export async function getPosts(): Promise<Post[]> {
  const db = await readDB();
  return db.posts;
}

export async function getPost(id: string): Promise<Post | undefined> {
  const db = await readDB();
  return db.posts.find((p) => p.id === id);
}

export async function getAllComments(): Promise<Record<string, Comment[]>> {
  const db = await readDB();
  return db.comments;
}

export async function getComments(postId: string): Promise<Comment[]> {
  const db = await readDB();
  return db.comments[postId] || [];
}

export async function createPost(
  input: { title: string; body: string; author: string; topicId: string; state: string | null; promo: Post["promo"] },
  voterId: string
): Promise<Post> {
  return withDB((db) => {
    const post: Post = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: input.title,
      body: input.body,
      author: input.author,
      topicId: input.topicId,
      state: input.state,
      promo: input.promo,
      score: 1,
      views: 0,
      createdAt: Date.now(),
    };
    db.posts.unshift(post);
    db.comments[post.id] = [];
    db.votes[`post:${post.id}`] = { [voterId]: 1 };
    return post;
  });
}

export async function addComment(
  postId: string,
  parentId: string | null,
  input: { author: string; body: string },
  voterId: string
): Promise<Comment> {
  return withDB((db) => {
    const comment: Comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      postId,
      parentId,
      author: input.author,
      body: input.body,
      score: 1,
      createdAt: Date.now(),
    };
    if (!db.comments[postId]) db.comments[postId] = [];
    db.comments[postId].push(comment);
    db.votes[`comment:${comment.id}`] = { [voterId]: 1 };
    return comment;
  });
}

export async function vote(
  targetType: "post" | "comment",
  targetId: string,
  postId: string | undefined,
  dir: 1 | -1,
  voterId: string
): Promise<{ score: number; dir: number }> {
  return withDB((db) => {
    const key = `${targetType}:${targetId}`;
    if (!db.votes[key]) db.votes[key] = {};
    const prevDir = db.votes[key][voterId] || 0;
    const newDir = prevDir === dir ? 0 : dir;
    const delta = newDir - prevDir;

    if (newDir === 0) delete db.votes[key][voterId];
    else db.votes[key][voterId] = newDir;

    if (targetType === "post") {
      const post = db.posts.find((p) => p.id === targetId);
      if (post) post.score += delta;
      return { score: post?.score ?? 0, dir: newDir };
    } else {
      if (!postId) throw new Error("postId required to vote on a comment");
      const comment = (db.comments[postId] || []).find((c) => c.id === targetId);
      if (comment) comment.score += delta;
      return { score: comment?.score ?? 0, dir: newDir };
    }
  });
}

export async function getVoteDirs(voterId: string): Promise<{ posts: Record<string, number>; comments: Record<string, number> }> {
  const db = await readDB();
  const posts: Record<string, number> = {};
  const comments: Record<string, number> = {};
  for (const [key, voters] of Object.entries(db.votes)) {
    const dir = voters[voterId];
    if (!dir) continue;
    const [type, id] = key.split(":");
    if (type === "post") posts[id] = dir;
    else comments[id] = dir;
  }
  return { posts, comments };
}

export async function registerView(postId: string, voterId: string): Promise<number> {
  return withDB((db) => {
    if (!db.viewedBy[postId]) db.viewedBy[postId] = [];
    const post = db.posts.find((p) => p.id === postId);
    if (!post) return 0;
    if (!db.viewedBy[postId].includes(voterId)) {
      db.viewedBy[postId].push(voterId);
      post.views = (post.views || 0) + 1;
    }
    return post.views;
  });
}
