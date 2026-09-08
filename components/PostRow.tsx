"use client";

import { useRouter } from "next/navigation";
import { Eye, MapPin, MessageSquare } from "lucide-react";
import type { Post, Role, Tier } from "@/lib/types";
import { timeAgo } from "@/lib/ranking";
import { VoteControl } from "./VoteControl";
import { TopicBadge } from "./TopicBadge";
import { AuthorBadges } from "./Badges";
import { Briefcase } from "lucide-react";

type TierWithIcon = (Tier & { icon: "crown" | "star" | "sprout" | "rocket"; text: string; bg: string }) | null;

export function PostRow({
  post,
  commentCount,
  onVote,
  dir,
  onTopic,
  badgesFor,
}: {
  post: Post;
  commentCount: number;
  onVote: (id: string, dir: 1 | -1) => void;
  dir: number;
  onTopic: (topicId: string) => void;
  badgesFor: (author: string) => { tier: TierWithIcon; role: Role | null };
}) {
  const router = useRouter();
  return (
    <div className="flex gap-4 py-4 border-b border-[#E6E3DA] cursor-pointer group" onClick={() => router.push(`/post/${post.id}`)}>
      <div className="shrink-0 pt-0.5">
        <VoteControl score={post.score} dir={dir} onVote={(d) => onVote(post.id, d)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5">
          <TopicBadge topicId={post.topicId} onClick={(e) => { e.stopPropagation(); onTopic(post.topicId); }} />
        </div>
        <h3 className="text-[16px] font-semibold leading-snug text-[#1C1B19] mb-1 group-hover:text-[#26364A] transition-colors">
          {post.title}
        </h3>
        <p className="text-[14px] text-[#5B584F] leading-relaxed line-clamp-2 mb-1.5">{post.body}</p>
        {post.promo && (
          <div className="flex items-center gap-1 text-[11px] text-[#217A78] mb-1.5">
            <Briefcase size={11} /> {post.promo.label}
          </div>
        )}
        <div className="flex items-center gap-2 text-[12px] text-[#9A968A]">
          <span>{post.author}</span>
          <AuthorBadges {...badgesFor(post.author)} />
          {post.state && (
            <span className="flex items-center gap-0.5">
              <MapPin size={11} /> {post.state}
            </span>
          )}
          <span>·</span>
          <span>{timeAgo(post.createdAt)}</span>
          <span className="flex items-center gap-1 ml-auto">
            <Eye size={12} /> {post.views || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={12} /> {commentCount}
          </span>
        </div>
      </div>
    </div>
  );
}
