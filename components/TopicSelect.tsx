"use client";

import { CATEGORIES } from "@/lib/taxonomy";

export function TopicSelect({ value, onChange }: { value: string; onChange: (topicId: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] transition-colors">
      {CATEGORIES.map((c) => (
        <optgroup key={c.id} label={c.label}>
          {c.topics.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
