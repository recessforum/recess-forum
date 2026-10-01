"use client";

import { AskThisExpertButton } from "@/components/AskExpert";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BadgeCheck, Check, ChevronLeft, ExternalLink, FolderOpen, Link2, Loader2, MessageSquare } from "lucide-react";
import { categoryOf } from "@/lib/taxonomy";
import { useAuth } from "@/lib/auth-context";
import { countsFor, karmaFor, roleFor, tierFor } from "@/lib/roles";
import { timeAgo } from "@/lib/ranking";
import type { Comment, Post, PublicProfile } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { AuthorBadges } from "@/components/Badges";
import { AuthorMenu } from "@/components/AuthorMenu";
import { PostRow } from "@/components/PostRow";
import { hasExpertAnswer } from "@/components/ExpertAnsweredBadge";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile: viewer } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [allComments, setAllComments] = useState<Record<string, Comment[]>>({});
  const [postVoteDirs, setPostVoteDirs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"posts" | "replies">("posts");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const [profileRes, bootstrapRes] = await Promise.all([
        fetch(`/api/profiles/${id}`),
        fetch("/api/bootstrap"),
      ]);
      if (!profileRes.ok) { setNotFound(true); setLoading(false); return; }
      const profileData = await profileRes.json();
      const bootstrap = await bootstrapRes.json();
      setProfile(profileData.profile);
      // An expert's answers are their portfolio, so open on replies.
      if (profileData.profile.role === "verified_expert") setTab("replies");
      setAllPosts(bootstrap.posts);
      setAllComments(bootstrap.comments);
      setPostVoteDirs(bootstrap.voteDirs.posts);
      setLoading(false);
    })();
  }, [id]);

  const handleVotePost = async (postId: string, dir: 1 | -1) => {
    if (!viewer) { router.push("/login"); return; }
    const prevDir = postVoteDirs[postId] || 0;
    const newDir = prevDir === dir ? 0 : dir;
    const delta = newDir - prevDir;
    setPostVoteDirs((s) => ({ ...s, [postId]: newDir }));
    setAllPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, score: p.score + delta } : p)));
    await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "post", targetId: postId, dir }),
    });
  };

  const badgesFor = useCallback(
    (item: Post) => ({ tier: tierFor(item.authorId, allPosts, allComments), role: roleFor(item.authorRole, item.authorExpertType) }),
    [allPosts, allComments]
  );

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1C1B19] mb-2">Profile not found</p>
        <button onClick={() => router.push("/")} className="text-[14px] font-medium text-[#26364A] hover:underline">Back to the feed</button>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 flex items-center justify-center gap-2 text-[#9A968A] text-[14px]">
        <Loader2 size={16} className="animate-spin" /> Loading...
      </div>
    );
  }

  const { postCount, commentCount } = countsFor(profile.id, allPosts, allComments);
  const karma = karmaFor(profile.id, allPosts, allComments);
  const tier = tierFor(profile.id, allPosts, allComments);
  const role = roleFor(profile.role, profile.expertType);
  const founding = profile.foundingNumber;
  const posts = allPosts.filter((p) => p.authorId === profile.id).sort((a, b) => b.createdAt - a.createdAt);
  const replies = Object.values(allComments).flat()
    .filter((c) => c.authorId === profile.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  const postById = new Map(allPosts.map((p) => [p.id, p]));
  const isExpert = profile.role === "verified_expert";
  const answeredTopics = isExpert
    ? [...new Set(replies.map((c) => categoryOf(postById.get(c.postId)?.topicId ?? "")?.label).filter(Boolean) as string[])]
    : [];
  const answeredPosts = new Set(replies.map((c) => c.postId)).size;
  const copyLink = async () => {
    await navigator.clipboard.writeText(`https://www.recessforum.com/u/${profile.id}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 w-full">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-[13px] font-medium text-[#5B584F] hover:text-[#1C1B19]">
          <ChevronLeft size={15} /> Back
        </button>
        {viewer?.id === profile.id ? (
          <Link href="/documents" className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold border border-[#E6E3DA] bg-white text-[#1C1B19] hover:border-[#26364A]">
            <FolderOpen size={14} /> My documents
          </Link>
        ) : (
          <AuthorMenu targetType="user" targetId={profile.id} authorId={profile.id} authorName={profile.displayName}
            onBlocked={() => router.push("/")} />
        )}
      </div>

      <div className="flex items-center gap-4 pb-6 mb-6 border-b border-[#E6E3DA]">
        <Avatar url={profile.avatarUrl} name={profile.displayName} size={56} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-[19px] font-semibold text-[#1C1B19]">{profile.displayName}</h1>
            <AuthorBadges tier={tier} role={role} founding={founding} />
          </div>
          <div className="flex items-center gap-3 text-[13px] text-[#9A968A]">
            <span className="text-[#26364A] font-medium">{karma} karma</span>
            <span>·</span>
            <button onClick={() => setTab("posts")}
              className={`font-medium ${tab === "posts" ? "text-[#26364A] underline" : "hover:text-[#26364A]"}`}>
              {postCount} {postCount === 1 ? "post" : "posts"}
            </button>
            <span>·</span>
            <button onClick={() => setTab("replies")}
              className={`flex items-center gap-1 font-medium ${tab === "replies" ? "text-[#26364A] underline" : "hover:text-[#26364A]"}`}>
              <MessageSquare size={12} /> {commentCount} {commentCount === 1 ? "reply" : "replies"}
            </button>
            <span>·</span>
            <span>joined {timeAgo(profile.createdAt)} ago</span>
          </div>
        </div>
      </div>

      {isExpert && (
        <div className="mb-6 p-5 border border-[#BFE0DE] bg-[#F3FAF9]">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#217A78] mb-2">
            <BadgeCheck size={16} /> Verified Expert{profile.expertType ? ` · ${profile.expertType}` : ""}
          </div>
          {profile.bio && <p className="text-[14px] text-[#1C1B19] leading-relaxed mb-3 whitespace-pre-line">{profile.bio}</p>}
          <p className="text-[13px] text-[#5B584F] mb-3">
            Has answered <span className="font-semibold text-[#1C1B19]">{answeredPosts}</span> {answeredPosts === 1 ? "parent question" : "parent questions"} on Recess Forum.
          </p>
          {answeredTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {answeredTopics.map((t) => <span key={t} className="text-[12px] font-medium px-2 py-0.5 bg-white border border-[#DDEDEB] text-[#217A78]">{t}</span>)}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <AskThisExpertButton expertId={profile.id} expertName={profile.displayName} viewerId={viewer?.id ?? null} />
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer nofollow"
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold bg-[#26364A] text-white hover:bg-[#1e2c3d]">
                <ExternalLink size={13} /> Visit website
              </a>
            )}
            <button onClick={copyLink} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium border border-[#C9D9D7] bg-white text-[#1C1B19] hover:border-[#217A78]">
              {linkCopied ? <Check size={13} /> : <Link2 size={13} />} {linkCopied ? "Link copied" : "Copy profile link"}
            </button>
          </div>
        </div>
      )}

      {tab === "posts" ? (
        posts.length === 0 ? (
          <p className="text-[14px] text-[#9A968A] italic">No posts yet.</p>
        ) : (
          posts.map((p) => (
            <PostRow key={p.id} post={p} commentCount={(allComments[p.id] || []).length} expertAnswered={hasExpertAnswer(allComments[p.id])}
              onVote={handleVotePost} dir={postVoteDirs[p.id] || 0} onTopic={() => router.push("/")} badgesFor={badgesFor} />
          ))
        )
      ) : (
        replies.length === 0 ? (
          <p className="text-[14px] text-[#9A968A] italic">No replies yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {replies.map((c) => {
              const post = postById.get(c.postId);
              return (
                <Link key={c.id} href={`/post/${c.postId}`}
                  className="block py-3 border-b border-[#E6E3DA] group">
                  <p className="text-[12px] text-[#9A968A] mb-1">
                    replying to <span className="text-[#5B584F] font-medium group-hover:text-[#26364A]">{post?.title ?? "a post"}</span>
                  </p>
                  <p className="text-[14px] text-[#3A382F] leading-relaxed line-clamp-2 mb-1">{c.body}</p>
                  <p className="text-[12px] text-[#9A968A]">{c.score} points · {timeAgo(c.createdAt)} ago</p>
                </Link>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
