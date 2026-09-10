"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, MapPin, MessageSquare } from "lucide-react";
import type { Post, Role, Tier } from "@/lib/types";
import { timeAgo } from "@/lib/ranking";
import { VoteControl } from "./VoteControl";
import { TopicBadge } from "./TopicBadge";
import { CircleBadge } from "./CircleBadge";
import { AuthorBadges } from "./Badges";
import { Avatar } from "./Avatar";
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
  badgesFor: (post: Post) => { tier: TierWithIcon; role: Role | null };
}) {
  const router = useRouter();
  return (
    <div className="flex gap-4 py-4 border-b border-[#E6E3DA] cursor-pointer group" onClick={() => router.push(`/post/${post.id}`)}>
      <div className="shrink-0 pt-0.5">
        <VoteControl score={post.score} dir={dir} onVote={(d) => onVote(post.id, d)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1.5">
          <TopicBadge topicId={post.topicId} onClick={(e) => { e.stopPropagation(); onTopic(post.topicId); }} />
          {post.circleId && post.circleName && <CircleBadge circleId={post.circleId} circleName={post.circleName} />}
        </div>
        <h3 className="text-[16px] font-semibold leading-snug text-[#1C1B19] mb-1 group-hover:text-[#26364A] transition-colors">
          {post.title}
        </h3>
        {post.body && <p className="text-[14px] text-[#5B584F] leading-relaxed line-clamp-2 mb-1.5">{post.body}</p>}
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded post photos, arbitrary Supabase Storage objects
          <img src={post.imageUrl} alt="" className="w-full max-h-64 object-cover mb-1.5" />
        )}
        {post.promo && (
          <div className="flex items-center gap-1 text-[11px] text-[#217A78] mb-1.5">
            <Briefcase size={11} /> {post.promo.label}
          </div>
        )}
        <div className="flex items-center gap-2 text-[12px] text-[#9A968A]">
          <Link href={`/u/${post.authorId}`} onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 hover:text-[#26364A]">
            <Avatar url={post.authorAvatarUrl} name={post.author} size={18} />
            <span>{post.author}</span>
          </Link>
          <AuthorBadges {...badgesFor(post)} />
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
