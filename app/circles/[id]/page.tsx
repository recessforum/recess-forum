"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, MapPin, Plus, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { roleFor, tierFor } from "@/lib/roles";
import type { Circle, Comment, Post, Promo } from "@/lib/types";
import { PostRow } from "@/components/PostRow";
import { NewPostModal } from "@/components/NewPostModal";

export default function CircleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();

  const [circle, setCircle] = useState<Circle | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allComments, setAllComments] = useState<Record<string, Comment[]>>({});
  const [postVoteDirs, setPostVoteDirs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);

  useEffect(() => {
    (async () => {
      const [circleRes, bootstrapRes] = await Promise.all([
        fetch(`/api/circles/${id}`),
        fetch("/api/bootstrap"),
      ]);
      if (!circleRes.ok) { setNotFound(true); setLoading(false); return; }
      const circleData = await circleRes.json();
      const bootstrap = await bootstrapRes.json();
      setCircle(circleData.circle);
      setIsMember(circleData.isMember);
      setPosts((bootstrap.posts as Post[]).filter((p) => p.circleId === id));
      setAllComments(bootstrap.comments);
      setPostVoteDirs(bootstrap.voteDirs.posts);
      setLoading(false);
    })();
  }, [id]);

  const toggleMembership = async () => {
    if (!profile) { router.push("/login"); return; }
    setJoining(true);
    const res = await fetch(`/api/circles/${id}/${isMember ? "leave" : "join"}`, { method: "POST" });
    if (res.ok) {
      setIsMember((m) => !m);
      setCircle((c) => c && { ...c, memberCount: c.memberCount + (isMember ? -1 : 1) });
    }
    setJoining(false);
  };

  const handleVotePost = async (postId: string, dir: 1 | -1) => {
    if (!profile) { router.push("/login"); return; }
    const prevDir = postVoteDirs[postId] || 0;
    const newDir = prevDir === dir ? 0 : dir;
    const delta = newDir - prevDir;
    setPostVoteDirs((s) => ({ ...s, [postId]: newDir }));
    setPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, score: p.score + delta } : p)));
    await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "post", targetId: postId, dir }),
    });
  };

  const handleNewPost = async (input: { title: string; body: string; topicId: string; state: string; promo: Promo | null; circleId: string | null }) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    setShowNewPost(false);
    if (data.post) router.push(`/post/${data.post.id}`);
  };

  const badgesFor = useCallback(
    (item: Post | Comment) => ({ tier: tierFor(item.authorId, posts, allComments), role: roleFor(item.authorRole, item.authorExpertType) }),
    [posts, allComments]
  );

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1C1B19] mb-2">Circle not found</p>
        <button onClick={() => router.push("/circles")} className="text-[14px] font-medium text-[#26364A] hover:underline">Back to circles</button>
      </div>
    );
  }

  if (loading || !circle) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 flex items-center justify-center gap-2 text-[#9A968A] text-[14px]">
        <Loader2 size={16} className="animate-spin" /> Loading...
      </div>
    );
  }

  const sortedPosts = [...posts].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 w-full">
      <button onClick={() => router.push("/circles")} className="flex items-center gap-1 text-[13px] font-medium text-[#5B584F] hover:text-[#1C1B19] mb-5">
        <ChevronLeft size={15} /> All circles
      </button>

      <div className="pb-6 mb-6 border-b border-[#E6E3DA]">
        <h1 className="text-[22px] font-semibold text-[#1C1B19] mb-1.5">{circle.name}</h1>
        <p className="text-[14px] text-[#5B584F] leading-relaxed mb-3">{circle.description}</p>
        <div className="flex items-center gap-3 text-[12px] text-[#9A968A] mb-4">
          {circle.state && (
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {circle.state}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={12} /> {circle.memberCount} member{circle.memberCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex gap-2">
          <button disabled={joining} onClick={toggleMembership}
            className={`px-4 py-2 text-[14px] font-semibold transition-colors disabled:opacity-40 ${
              isMember
                ? "border border-[#E6E3DA] text-[#5B584F] hover:text-[#B23B3B] hover:border-[#B23B3B]"
                : "bg-[#26364A] text-white hover:bg-[#1e2c3d]"
            }`}>
            {isMember ? "Leave circle" : "Join circle"}
          </button>
          {isMember && (
            <button onClick={() => setShowNewPost(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium border border-[#E6E3DA] text-[#5B584F] hover:text-[#1C1B19] transition-colors">
              <Plus size={15} /> New post
            </button>
          )}
        </div>
      </div>

      {sortedPosts.length === 0 ? (
        <p className="text-[14px] text-[#9A968A] italic">No posts in this circle yet.</p>
      ) : (
        sortedPosts.map((p) => (
          <PostRow key={p.id} post={p} commentCount={(allComments[p.id] || []).length}
            onVote={handleVotePost} dir={postVoteDirs[p.id] || 0} onTopic={() => router.push("/")} badgesFor={badgesFor} />
        ))
      )}

      {showNewPost && (
        <NewPostModal defaultTopic={null} circleId={circle.id} circleName={circle.name} onClose={() => setShowNewPost(false)} onSubmit={handleNewPost} />
      )}
    </div>
  );
}
