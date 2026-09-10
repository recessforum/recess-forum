"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Comment, Role, Tier } from "@/lib/types";
import { timeAgo } from "@/lib/ranking";
import { VoteControl } from "./VoteControl";
import { AuthorBadges } from "./Badges";
import { Avatar } from "./Avatar";
import { AuthorMenu } from "./AuthorMenu";
import { useAuth } from "@/lib/auth-context";

type TierWithIcon = (Tier & { icon: "crown" | "star" | "sprout" | "rocket"; text: string; bg: string }) | null;

export function CommentNode({
  comment,
  depth,
  allComments,
  voteDirs,
  onVote,
  onReply,
  badgesFor,
  onBlocked,
}: {
  comment: Comment;
  depth: number;
  allComments: Comment[];
  voteDirs: Record<string, number>;
  onVote: (id: string, dir: 1 | -1) => void;
  onReply: (postId: string, parentId: string | null, input: { body: string }) => Promise<void>;
  badgesFor: (comment: Comment) => { tier: TierWithIcon; role: Role | null };
  onBlocked?: () => void;
}) {
  const router = useRouter();
  const { profile } = useAuth();
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const children = allComments.filter((c) => c.parentId === comment.id).sort((a, b) => b.score - a.score);
  const cappedDepth = Math.min(depth, 5);

  const startReplying = () => {
    if (!profile) { router.push("/login"); return; }
    setReplying((r) => !r);
  };

  const submitReply = async () => {
    if (!text.trim()) return;
    setSending(true);
    setReplyError(null);
    try {
      await onReply(comment.postId, comment.id, { body: text.trim() });
      setText("");
      setReplying(false);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
    setSending(false);
  };

  return (
    <div style={{ marginLeft: cappedDepth ? 20 : 0 }} className={cappedDepth ? "pl-4 border-l border-[#E6E3DA]" : ""}>
      <div className="mb-2">
        <div className="flex items-center gap-2 text-[13px] mb-0.5">
          <Link href={`/u/${comment.authorId}`} className="flex items-center gap-2 hover:text-[#26364A]">
            <Avatar url={comment.authorAvatarUrl} name={comment.author} size={18} />
            <span className="font-semibold text-[#1C1B19]">{comment.author}</span>
          </Link>
          <AuthorBadges {...badgesFor(comment)} />
          <span className="text-[12px] text-[#9A968A]">{timeAgo(comment.createdAt)}</span>
          <AuthorMenu targetType="comment" targetId={comment.id} authorId={comment.authorId} authorName={comment.author} onBlocked={onBlocked} />
        </div>
        <p className="text-[14px] text-[#3A382F] leading-relaxed mb-1.5">{comment.body}</p>
        <div className="flex items-center gap-4">
          <VoteControl vertical={false} score={comment.score} dir={voteDirs[comment.id] || 0} onVote={(d) => onVote(comment.id, d)} />
          <button onClick={startReplying} className="text-[12px] font-medium text-[#9A968A] hover:text-[#26364A]">Reply</button>
        </div>
        {replying && (
          <div className="mt-2 mb-1">
            <p className="text-[11px] text-[#9A968A] mb-1.5">Replying as {profile?.display_name}</p>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Write a reply..."
              className="w-full mb-2 px-3 py-2 border border-[#E6E3DA] bg-[#FAF9F7] text-[13px] outline-none focus:border-[#26364A] resize-none" />
            {replyError && <p className="text-[12px] text-[#B23B3B] mb-2">{replyError}</p>}
            <div className="flex gap-2">
              <button disabled={!text.trim() || sending} onClick={submitReply}
                className="px-3 py-1.5 text-[12px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-1.5">
                {sending && <Loader2 size={12} className="animate-spin" />} Reply
              </button>
              <button onClick={() => setReplying(false)} className="px-3 py-1.5 text-[12px] font-medium text-[#5B584F]">Cancel</button>
            </div>
          </div>
        )}
      </div>
      {children.map((child) => (
        <CommentNode key={child.id} comment={child} depth={depth + 1} allComments={allComments} voteDirs={voteDirs} onVote={onVote} onReply={onReply} badgesFor={badgesFor} onBlocked={onBlocked} />
      ))}
    </div>
  );
}
