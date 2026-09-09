"use client";

import { useState } from "react";
import { ChevronDown, ListTree, X } from "lucide-react";
import { CATEGORIES, colorForCategory, topicById, type Topic } from "@/lib/taxonomy";

function TopicRow({ topic, categoryId, active, onClick }: { topic: Topic; categoryId: string; active: boolean; onClick: () => void }) {
  const c = colorForCategory(categoryId);
  return (
    <button onClick={onClick}
      style={{ borderLeftColor: active ? c.solid : "transparent", backgroundColor: active ? c.bg : "transparent" }}
      className="text-left px-4 py-2.5 text-[14px] w-full border-l-2 transition-colors flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.solid }} />
      <span className={active ? "font-semibold text-[#1C1B19]" : "text-[#5B584F]"}>{topic.label}</span>
    </button>
  );
}

export function MobileTopicDrawer({ selectedTopic, onSelectTopic }: { selectedTopic: string | null; onSelectTopic: (topicId: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [openCat, setOpenCat] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) => setOpenCat((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const activeTopic = selectedTopic ? topicById(selectedTopic) : null;

  return (
    <div className="md:hidden mb-3">
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 border border-[#E6E3DA] bg-white text-[13px] text-[#1C1B19]">
        <span className="flex items-center gap-2 font-medium truncate">
          <ListTree size={15} className="text-[#9A968A] shrink-0" />
          {activeTopic ? activeTopic.label : "Browse topics"}
        </span>
        <ChevronDown size={14} className="text-[#9A968A] shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[82%] max-w-[320px] bg-[#F7F6F3] overflow-y-auto flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E6E3DA] shrink-0">
              <span className="text-[14px] font-semibold text-[#1C1B19]">Topics</span>
              <button onClick={() => setOpen(false)} className="p-1 text-[#9A968A]" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <button onClick={() => { onSelectTopic(null); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[14px] font-semibold border-l-2 ${!selectedTopic ? "border-[#26364A] text-[#1C1B19] bg-[#EFEDE6]" : "border-transparent text-[#5B584F]"}`}>
                All Topics
              </button>
              {CATEGORIES.map((cat) => (
                <div key={cat.id} className="mt-1">
                  <button onClick={() => toggle(cat.id)}
                    className="w-full flex items-center justify-between px-4 py-2 text-[12px] font-semibold text-[#9A968A] tracking-wide">
                    {cat.label}
                    <ChevronDown size={12} className={`transition-transform ${openCat.has(cat.id) ? "" : "-rotate-90"}`} />
                  </button>
                  {openCat.has(cat.id) && (
                    <div className="flex flex-col">
                      {cat.topics.map((t) => (
                        <TopicRow key={t.id} topic={t} categoryId={cat.id} active={selectedTopic === t.id}
                          onClick={() => { onSelectTopic(selectedTopic === t.id ? null : t.id); setOpen(false); }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
