"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Flame, Loader2, MapPin, Search, Trophy } from "lucide-react";
import { CATEGORIES, categoryOf, colorForCategory, topicById } from "@/lib/taxonomy";
import { topicLabel } from "@/lib/taxonomy";
import { US_STATES } from "@/lib/location";
import { hotScore, rangeCutoff } from "@/lib/ranking";
import { roleFor, tierFor } from "@/lib/roles";
import type { Comment, Post } from "@/lib/types";
import { Sidebar } from "@/components/Sidebar";
import { MobileTopicDrawer } from "@/components/MobileTopicDrawer";
import { PostRow } from "@/components/PostRow";
import { useAuth } from "@/lib/auth-context";

type Sort = "hot" | "new" | "top";
type TopRange = "day" | "week" | "month" | "all";

export default function HomePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("hot");
  const [topRange, setTopRange] = useState<TopRange>("week");
  const [query, setQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const [postVoteDirs, setPostVoteDirs] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/bootstrap");
        if (!res.ok) throw new Error("bootstrap failed");
        const data = await res.json();
        setPosts(data.posts);
        setComments(data.comments);
        setPostVoteDirs(data.voteDirs.posts);
      } catch {
        setError("Couldn't load the board. Try refreshing.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleVotePost = useCallback(async (id: string, dir: 1 | -1) => {
    if (!profile) { router.push("/login"); return; }
    const prevDir = postVoteDirs[id] || 0;
    const newDir = prevDir === dir ? 0 : dir;
    const delta = newDir - prevDir;
    setPostVoteDirs((s) => ({ ...s, [id]: newDir }));
    setPosts((ps) => ps && ps.map((p) => (p.id === id ? { ...p, score: p.score + delta } : p)));
    await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "post", targetId: id, dir }),
    });
  }, [postVoteDirs, profile, router]);

  const badgesFor = useCallback(
    (item: Post | Comment) => ({ tier: tierFor(item.authorId, posts || [], comments), role: roleFor(item.authorRole, item.authorExpertType) }),
    [posts, comments]
  );

  const activeTopic = selectedTopic ? topicById(selectedTopic) : null;
  const activeCategory = selectedTopic ? categoryOf(selectedTopic) : null;
  const goTopic = (topicId: string | null) => { setSelectedTopic(topicId); setSelectedCategory(null); };
  const goCategory = (categoryId: string) => {
    setSelectedCategory((c) => (c === categoryId ? null : categoryId));
    setSelectedTopic(null);
  };

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    const q = query.trim().toLowerCase();
    let list = posts.filter((p) => {
      if (selectedTopic && p.topicId !== selectedTopic) return false;
      if (!selectedTopic && selectedCategory && topicById(p.topicId)?.categoryId !== selectedCategory) return false;
      if (selectedState && p.state !== selectedState) return false;
      if (!q) return true;
      return `${p.title} ${p.body ?? ""} ${topicLabel(p.topicId)} ${p.author}`.toLowerCase().includes(q);
    });
    if (sort === "top") {
      const cutoff = rangeCutoff(topRange);
      list = list.filter((p) => p.createdAt >= cutoff).sort((a, b) => b.score - a.score);
    } else if (sort === "new") {
      list = [...list].sort((a, b) => b.createdAt - a.createdAt);
    } else {
      list = [...list].sort((a, b) => hotScore(b.score, b.views, b.createdAt) - hotScore(a.score, a.views, a.createdAt));
    }
    return list;
  }, [posts, selectedTopic, selectedCategory, selectedState, sort, topRange, query]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex gap-10 w-full">
      <Sidebar selectedTopic={selectedTopic} onSelectTopic={goTopic} />

      <main className="flex-1 min-w-0">
        {activeTopic && (
          <div className="mb-6 pb-5 border-b border-[#E6E3DA] border-l-4 pl-4" style={{ borderLeftColor: colorForCategory(activeCategory?.id).solid }}>
            <div className="text-[12px] font-medium mb-1" style={{ color: colorForCategory(activeCategory?.id).text }}>{activeCategory?.label}</div>
            <div className="text-[20px] font-semibold text-[#1C1B19]">{activeTopic.label}</div>
            <div className="text-[13px] text-[#5B584F] mt-0.5">{activeTopic.blurb}</div>
          </div>
        )}
        {!activeTopic && selectedCategory && (
          <div className="mb-6 pb-5 border-b border-[#E6E3DA] border-l-4 pl-4" style={{ borderLeftColor: colorForCategory(selectedCategory).solid }}>
            <div className="text-[20px] font-semibold text-[#1C1B19]">{CATEGORIES.find((c) => c.id === selectedCategory)?.label}</div>
            <div className="text-[13px] text-[#5B584F] mt-0.5">All topics in this category</div>
          </div>
        )}

        <MobileTopicDrawer selectedTopic={selectedTopic} onSelectTopic={goTopic} />

        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A968A]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts by topic, keyword, or interest..."
            className="w-full pl-9 pr-3 py-2.5 border border-[#E6E3DA] bg-white text-[14px] outline-none focus:border-[#26364A] transition-colors" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-5">
          {CATEGORIES.map((c) => {
            const col = colorForCategory(c.id);
            const active = selectedCategory === c.id;
            return (
              <button key={c.id} onClick={() => goCategory(c.id)}
                style={{ backgroundColor: active ? col.solid : col.bg, color: active ? "#FFFFFF" : col.text }}
                className="text-[12px] font-medium px-2.5 py-1 rounded-sm transition-colors">
                {c.label}
              </button>
            );
          })}
          <div className="relative ml-auto">
            <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9A968A] pointer-events-none" />
            <select value={selectedState || ""} onChange={(e) => setSelectedState(e.target.value || null)}
              className="pl-7 pr-2 py-1.5 text-[12px] border border-[#E6E3DA] bg-white outline-none appearance-none">
              <option value="">All states</option>
              {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <div className="flex items-center gap-4 text-[13px]">
            {([
              { id: "hot", icon: Flame, label: "Hot" },
              { id: "new", icon: Clock, label: "New" },
              { id: "top", icon: Trophy, label: "Top" },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setSort(id)}
                className={`flex items-center gap-1.5 pb-2 border-b-2 transition-colors ${sort === id ? "border-[#26364A] text-[#1C1B19] font-medium" : "border-transparent text-[#9A968A] hover:text-[#1C1B19]"}`}>
                <Icon size={13} /> {label}
              </button>
            ))}
            {sort === "top" && (
              <select value={topRange} onChange={(e) => setTopRange(e.target.value as TopRange)}
                className="text-[12px] border border-[#E6E3DA] bg-white px-2 py-1 outline-none">
                <option value="day">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="all">All time</option>
              </select>
            )}
          </div>
          <span className="text-[12px] text-[#9A968A]">{filteredPosts.length} posts</span>
        </div>

        {error && <p className="text-[13px] text-[#26364A] mt-3">{error}</p>}

        {loading ? (
          <div className="flex items-center gap-2 text-[#9A968A] text-[14px] py-12 justify-center">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-[#9A968A]">
            <p className="text-[16px] font-semibold text-[#1C1B19] mb-1">Nothing here yet</p>
            <p className="text-[14px]">{query ? "No posts match your search." : "Be the first to post in this category."}</p>
          </div>
        ) : (
          <div>
            {filteredPosts.map((p) => (
              <PostRow key={p.id} post={p} commentCount={(comments[p.id] || []).length}
                onVote={handleVotePost} dir={postVoteDirs[p.id] || 0} onTopic={goTopic} badgesFor={badgesFor} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
