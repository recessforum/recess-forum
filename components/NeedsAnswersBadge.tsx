import { HelpCircle } from "lucide-react";

/* Shown on any post with zero replies, so parents browsing the feed can spot
   questions still waiting for someone with experience. Outlined (not solid
   like topic badges) so it reads as a status, not a category. */
export function NeedsAnswersBadge() {
  return (
    <span className="text-[12px] font-medium px-2 py-0.5 rounded-sm inline-flex items-center gap-1 border border-[#E3B89A] bg-[#FDF3EB] text-[#B4532A]">
      <HelpCircle size={11} /> Needs answers
    </span>
  );
}
