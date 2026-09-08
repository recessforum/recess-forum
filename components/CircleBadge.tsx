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
      className="text-[12px] font-medium px-2 py-0.5 rounded-sm inline-flex items-center gap-1 bg-[#EFEDE6] text-[#5B584F] hover:opacity-80 transition-opacity"
    >
      <Users size={11} /> {circleName}
    </button>
  );
}
