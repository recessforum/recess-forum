"use client";

import { useRouter } from "next/navigation";
import { Users } from "lucide-react";

export function CircleBadge({ circleId, circleName }: { circleId: string; circleName: string }) {
  const router = useRouter();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/circles/${circleId}`);
      }}
      title={`From the ${circleName} circle`}
      className="text-[12px] font-medium px-2 py-0.5 rounded-sm inline-flex items-center gap-1 max-w-[220px] bg-[#F5EEDC] text-[#7A5F1E] hover:opacity-80 transition-opacity"
    >
      <Users size={11} className="shrink-0" />
      <span className="shrink-0">Circle ·</span>
      <span className="truncate">{circleName}</span>
    </button>
  );
}
