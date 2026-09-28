import { BadgeCheck } from "lucide-react";
import type { Comment } from "@/lib/types";

/** True when any reply on the post (top-level or nested) is from a Verified Expert. */
export const hasExpertAnswer = (comments: Comment[] | undefined) =>
  !!comments?.some((c) => c.authorRole === "verified_expert");

/* Shown on posts a Verified Expert has replied to, so parents browsing the
   feed can spot questions with a professional answer. Same teal as the
   Verified Expert author badge so the two read as related. */
export function ExpertAnsweredBadge() {
  return (
    <span className="text-[12px] font-medium px-2 py-0.5 rounded-sm inline-flex items-center gap-1 border border-[#BFE0DE] bg-[#E4F2F1] text-[#217A78]">
      <BadgeCheck size={11} /> Answered by a Verified Expert
    </span>
  );
}
