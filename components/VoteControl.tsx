"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";

export function VoteControl({
  score,
  dir,
  onVote,
  vertical = true,
}: {
  score: number;
  dir: number;
  onVote: (dir: 1 | -1) => void;
  vertical?: boolean;
}) {
  return (
    <div className={`flex ${vertical ? "flex-col" : "flex-row"} items-center gap-1`}>
      <button onClick={(e) => { e.stopPropagation(); onVote(1); }}
        className={`transition-colors ${dir === 1 ? "text-[#B08D45]" : "text-[#B7B3A8] hover:text-[#26364A]"}`} aria-label="Upvote">
        <ThumbsUp size={vertical ? 16 : 14} strokeWidth={2.25} fill={dir === 1 ? "currentColor" : "none"} />
      </button>
      <span className="text-[13px] font-medium text-[#1C1B19] tabular-nums min-w-[1.5ch] text-center">{score}</span>
      <button onClick={(e) => { e.stopPropagation(); onVote(-1); }}
        className={`transition-colors ${dir === -1 ? "text-[#26364A]" : "text-[#B7B3A8] hover:text-[#26364A]"}`} aria-label="Downvote">
        <ThumbsDown size={vertical ? 16 : 14} strokeWidth={2.25} fill={dir === -1 ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
