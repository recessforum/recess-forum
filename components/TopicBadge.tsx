"use client";

import { colorForTopic, topicLabel } from "@/lib/taxonomy";

export function TopicBadge({ topicId, onClick }: { topicId: string; onClick: (e: React.MouseEvent) => void }) {
  const c = colorForTopic(topicId);
  return (
    <button onClick={onClick} style={{ backgroundColor: c.bg, color: c.text }}
      className="text-[12px] font-medium px-2 py-0.5 rounded-sm inline-block hover:opacity-80 transition-opacity">
      {topicLabel(topicId)}
    </button>
  );
}
