"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Eye, Loader2, MapPin } from "lucide-react";
import { Briefcase } from "lucide-react";
import type { Comment, Post } from "@/lib/types";
import { timeAgo } from "@/lib/ranking";
import { karmaFor, roleFor, tierFor } from "@/lib/roles";
import { TopicBadge } from "@/components/TopicBadge";
import { VoteControl } from "@/components/VoteControl";
import { AuthorBadges } from "@/components/Badges";
import { CommentNode } from "@/components/CommentNode";
import { useAuth } from "@/lib/auth-context";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [postVoteDirs, setPostVoteDirs] = useState<Record<string, number>>({});
  const [commentVoteDirs, setCommentVoteDirs] = useState<Record<string, number>>({});
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [allComments, setAllComments] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [commentSort, setCommentSort] = useState<"best" | "new">("best");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const viewedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const [postRes, bootstrapRes] = await Promise.all([
        fetch(`/api/posts/${id}`),
        fetch("/api/bootstrap"),
      ]);
      if (!postRes.ok) { setNotFound(true); setLoading(false); return; }
      const data = await postRes.json();
      const bootstrap = await bootstrapRes.json();
      setPost(data.post);
      setComments(data.comments);
      setPostVoteDirs(data.voteDirs.posts);
      setCommentVoteDirs(data.voteDirs.comments);
      setAllPosts(bootstrap.posts);
      setAllComments(bootstrap.comments);
      setLoading(false);
      if (!viewedRef.current) {
        viewedRef.current = true;
        fetch(`/api/posts/${id}/view`, { method: "POST" })
          .then((r) => r.json())
          .then((d) => setPost((p) => (p ? { ...p, views: d.views } : p)))
          .catch(() => {});
      }
    })();
  }, [id]);

  const karma = useCallback((authorId: string) => karmaFor(authorId, allPosts, allComments), [allPosts, allComments]);
  const badgesFor = useCallback(
    (item: Post | Comment) => ({ tier: tierFor(item.authorId, allPosts, allComments), role: roleFor(item.authorRole, item.authorExpertType) }),
    [allPosts, allComments]
  );

  const handleVotePost = async (postId: string, dir: 1 | -1) => {
    if (!profile) { router.push("/login"); return; }
    const prevDir = postVoteDirs[postId] || 0;
    const newDir = prevDir === dir ? 0 : dir;
    const delta = newDir - prevDir;
    setPostVoteDirs((s) => ({ ...s, [postId]: newDir }));
    setPost((p) => (p ? { ...p, score: p.score + delta } : p));
    await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "post", targetId: postId, dir }),
    });
  };

  const handleVoteComment = async (commentId: string, dir: 1 | -1) => {
    if (!profile) { router.push("/login"); return; }
    const prevDir = commentVoteDirs[commentId] || 0;
    const newDir = prevDir === dir ? 0 : dir;
    const delta = newDir - prevDir;
    setCommentVoteDirs((s) => ({ ...s, [commentId]: newDir }));
    setComments((cs) => cs.map((c) => (c.id === commentId ? { ...c, score: c.score + delta } : c)));
    await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "comment", targetId: commentId, postId: id, dir }),
    });
  };

  const handleAddComment = async (postId: string, parentId: string | null, input: { body: string }) => {
    if (!profile) { router.push("/login"); return; }
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, ...input }),
    });
    const data = await res.json();
    if (data.comment) {
      setComments((cs) => [...cs, data.comment]);
      setCommentVoteDirs((s) => ({ ...s, [data.comment.id]: 1 }));
    }
  };

  const submitTopLevel = async () => {
    if (!text.trim() || !post) return;
    setSending(true);
    await handleAddComment(post.id, null, { body: text.trim() });
    setText("");
    setSending(false);
  };

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1C1B19] mb-2">Post not found</p>
        <button onClick={() => router.push("/")} className="text-[14px] font-medium text-[#26364A] hover:underline">Back to the feed</button>
      </div>
    );
  }

  if (loading || !post) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 flex items-center justify-center gap-2 text-[#9A968A] text-[14px]">
        <Loader2 size={16} className="animate-spin" /> Loading...
      </div>
    );
  }

  const topLevel = comments.filter((c) => !c.parentId).sort((a, b) => (commentSort === "new" ? b.createdAt - a.createdAt : b.score - a.score));

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 w-full">
      <button onClick={() => router.push("/")} className="flex items-center gap-1 text-[13px] font-medium text-[#5B584F] hover:text-[#1C1B19] mb-5">
        <ChevronLeft size={15} /> Back
      </button>

      <div className="mb-2">
        <TopicBadge topicId={post.topicId} onClick={() => router.push("/")} />
      </div>
      <h1 className="text-[24px] font-semibold leading-tight text-[#1C1B19] mb-2">{post.title}</h1>
      <div className="text-[13px] text-[#9A968A] mb-4 flex items-center gap-1.5 flex-wrap">
        <span>{post.author}</span>
        <AuthorBadges {...badgesFor(post)} />
        <span className="text-[#26364A] font-medium">· {karma(post.authorId)} karma</span>
        {post.state && (
          <span className="flex items-center gap-0.5">· <MapPin size={12} className="ml-1" /> {post.state}</span>
        )}
        <span>· {timeAgo(post.createdAt)} ago</span>
        <span className="flex items-center gap-0.5">· <Eye size={12} className="ml-1" /> {post.views || 0} views</span>
      </div>
      <p className="text-[15px] text-[#3A382F] leading-relaxed mb-4 whitespace-pre-wrap">{post.body}</p>
      {post.promo && (
        <div className="flex items-center gap-2 text-[13px] text-[#217A78] bg-[#E4F2F1] px-3 py-2 mb-4">
          <Briefcase size={14} className="shrink-0" />
          <span>{post.promo.label}</span>
          {post.promo.url && (
            <a href={post.promo.url} target="_blank" rel="noreferrer" className="ml-auto font-medium underline shrink-0">Visit</a>
          )}
        </div>
      )}
      <div className="flex items-center gap-4 pb-6 mb-6 border-b border-[#E6E3DA]">
        <VoteControl vertical={false} score={post.score} dir={postVoteDirs[post.id] || 0} onVote={(d) => handleVotePost(post.id, d)} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-[#1C1B19]">
          {comments.length} {comments.length === 1 ? "reply" : "replies"}
        </h2>
        <div className="flex gap-3 text-[12px]">
          {(["best", "new"] as const).map((s) => (
            <button key={s} onClick={() => setCommentSort(s)}
              className={`font-medium capitalize ${commentSort === s ? "text-[#26364A]" : "text-[#9A968A] hover:text-[#1C1B19]"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        {topLevel.map((c) => (
          <CommentNode key={c.id} comment={c} depth={0} allComments={comments} voteDirs={commentVoteDirs} onVote={handleVoteComment} onReply={handleAddComment} badgesFor={badgesFor} />
        ))}
        {comments.length === 0 && <p className="text-[14px] text-[#9A968A] italic">No replies yet — be the first to weigh in.</p>}
      </div>

      <div className="border-t border-[#E6E3DA] pt-5">
        {profile ? (
          <>
            <p className="text-[12px] text-[#9A968A] mb-1.5">Replying as {profile.display_name}</p>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Add your reply..."
              className="w-full mb-2 px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] resize-none" />
            <button disabled={!text.trim() || sending} onClick={submitTopLevel}
              className="px-4 py-2 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-2 hover:bg-[#1e2c3d] transition-colors">
              {sending && <Loader2 size={14} className="animate-spin" />} Reply
            </button>
          </>
        ) : (
          <p className="text-[14px] text-[#5B584F]">
            <button onClick={() => router.push("/login")} className="text-[#26364A] font-semibold hover:underline">Log in</button> to reply.
          </p>
        )}
      </div>
    </div>
  );
}
