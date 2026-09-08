"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CATEGORIES, colorForCategory, type Topic } from "@/lib/taxonomy";

function TopicRow({ topic, categoryId, active, onClick }: { topic: Topic; categoryId: string; active: boolean; onClick: () => void }) {
  const c = colorForCategory(categoryId);
  return (
    <button onClick={onClick}
      style={{ borderLeftColor: active ? c.solid : "transparent", backgroundColor: active ? c.bg : "transparent" }}
      className="text-left px-2.5 py-1.5 text-[13px] w-full border-l-2 transition-colors flex items-center gap-2 hover:bg-[#EFEDE6]">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.solid }} />
      <span className={active ? "font-semibold text-[#1C1B19]" : "text-[#5B584F]"}>{topic.label}</span>
    </button>
  );
}

export function Sidebar({ selectedTopic, onSelectTopic }: { selectedTopic: string | null; onSelectTopic: (topicId: string | null) => void }) {
  const [openCat, setOpenCat] = useState<Set<string>>(() => new Set(CATEGORIES.map((c) => c.id)));
  const toggle = (id: string) => setOpenCat((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  return (
    <aside className="w-60 shrink-0 hidden md:flex flex-col max-h-[calc(100vh-140px)] overflow-y-auto pr-2">
      <button onClick={() => onSelectTopic(null)}
        className={`text-left px-2.5 py-2 text-[13px] font-semibold mb-3 border-l-2 ${!selectedTopic ? "border-[#26364A] text-[#1C1B19] bg-[#EFEDE6]" : "border-transparent text-[#5B584F] hover:text-[#1C1B19]"}`}>
        All Topics
      </button>
      {CATEGORIES.map((cat) => (
        <div key={cat.id} className="mb-1">
          <button onClick={() => toggle(cat.id)} className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-[#9A968A] tracking-wide">
            {cat.label}
            <ChevronDown size={12} className={`transition-transform ${openCat.has(cat.id) ? "" : "-rotate-90"}`} />
          </button>
          {openCat.has(cat.id) && (
            <div className="flex flex-col mb-2">
              {cat.topics.map((t) => (
                <TopicRow key={t.id} topic={t} categoryId={cat.id} active={selectedTopic === t.id} onClick={() => onSelectTopic(selectedTopic === t.id ? null : t.id)} />
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}
