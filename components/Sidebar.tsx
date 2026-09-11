"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Info, MapPin } from "lucide-react";
import { CATEGORIES, colorForCategory, type Category, type Topic } from "@/lib/taxonomy";
import { US_STATES } from "@/lib/location";
import type { Post } from "@/lib/types";

const NEW_TAG_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

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

function CategoryGroup({
  cat, isNew, open, onToggle, selectedTopic, onSelectTopic,
}: {
  cat: Category; isNew: boolean; open: boolean; onToggle: () => void;
  selectedTopic: string | null; onSelectTopic: (id: string | null) => void;
}) {
  return (
    <div className="mb-1">
      <div className="group relative">
        <button onClick={onToggle} className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-semibold text-[#5B584F] tracking-wide">
          <span className="flex-1 text-left">{cat.label}</span>
          {isNew && <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-[#B23B3B] text-white tracking-wide">New</span>}
          {cat.tooltip && <Info size={11} className="shrink-0" />}
          <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
        {cat.tooltip && (
          <div className="pointer-events-none absolute left-2.5 top-full z-10 mt-1 w-56 rounded-sm bg-[#1C1B19] px-2.5 py-2 text-[11px] leading-snug text-white opacity-0 transition-opacity group-hover:opacity-100">
            {cat.tooltip}
          </div>
        )}
      </div>
      {open && (
        <div className="flex flex-col mb-2">
          {cat.topics.map((t) => (
            <TopicRow key={t.id} topic={t} categoryId={cat.id} active={selectedTopic === t.id} onClick={() => onSelectTopic(selectedTopic === t.id ? null : t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  selectedTopic, onSelectTopic, selectedState, onSelectState, posts,
}: {
  selectedTopic: string | null;
  onSelectTopic: (topicId: string | null) => void;
  selectedState: string | null;
  onSelectState: (state: string | null) => void;
  posts: Post[] | null;
}) {
  const [openCat, setOpenCat] = useState<Set<string>>(() => new Set());
  const [editingState, setEditingState] = useState(false);
  const toggle = (id: string) => setOpenCat((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const recentCategoryIds = useMemo(() => {
    if (!posts) return new Set<string>();
    const cutoff = Date.now() - NEW_TAG_WINDOW_MS;
    const ids = new Set<string>();
    for (const p of posts) {
      if (p.createdAt < cutoff) continue;
      const cat = CATEGORIES.find((c) => c.topics.some((t) => t.id === p.topicId));
      if (cat) ids.add(cat.id);
    }
    return ids;
  }, [posts]);

  const nationwide = CATEGORIES.filter((c) => c.scope === "nationwide");
  const local = CATEGORIES.filter((c) => c.scope === "local");
  const stateName = selectedState ? US_STATES.find((s) => s.code === selectedState)?.name : null;

  return (
    <aside className="w-60 shrink-0 hidden drawer:flex flex-col max-h-[calc(100vh-140px)] overflow-y-auto pr-2">
      <button onClick={() => onSelectTopic(null)}
        className={`text-left px-2.5 py-2 text-[13px] font-semibold mb-3 border-l-2 ${!selectedTopic ? "border-[#26364A] text-[#1C1B19] bg-[#EFEDE6]" : "border-transparent text-[#5B584F] hover:text-[#1C1B19]"}`}>
        All Topics
      </button>

      <div className="px-2.5 text-[11px] font-semibold text-[#9A968A] tracking-wide mb-1">NATIONWIDE</div>
      {nationwide.map((cat) => (
        <CategoryGroup key={cat.id} cat={cat} isNew={recentCategoryIds.has(cat.id)} open={openCat.has(cat.id)}
          onToggle={() => toggle(cat.id)} selectedTopic={selectedTopic} onSelectTopic={onSelectTopic} />
      ))}

      <div className="px-2.5 text-[11px] font-semibold text-[#9A968A] tracking-wide mb-1 mt-2">LOCAL</div>
      <div className="px-2.5 mb-2">
        {selectedState && !editingState ? (
          <button onClick={() => setEditingState(true)} className="flex items-center gap-1.5 text-[12px]">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#EFEDE6] text-[#3A382F] font-medium">
              <MapPin size={11} /> {stateName} <ChevronDown size={10} />
            </span>
            <span className="text-[10px] text-[#9A968A] italic">saved for next visit</span>
          </button>
        ) : (
          <div>
            <p className="text-[11px] text-[#9A968A] leading-snug mb-1.5">
              Showing posts from every state. Only want to see posts from where you live? Select your state below.
            </p>
            <div className="relative">
              <MapPin size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#9A968A] pointer-events-none" />
              <select autoFocus={editingState} value={selectedState || ""}
                onChange={(e) => { onSelectState(e.target.value || null); setEditingState(false); }}
                onBlur={() => setEditingState(false)}
                className="w-full pl-6 pr-2 py-1.5 text-[12px] border border-[#E6E3DA] bg-white outline-none appearance-none">
                <option value="">All states</option>
                {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
      {local.map((cat) => (
        <CategoryGroup key={cat.id} cat={cat} isNew={recentCategoryIds.has(cat.id)} open={openCat.has(cat.id)}
          onToggle={() => toggle(cat.id)} selectedTopic={selectedTopic} onSelectTopic={onSelectTopic} />
      ))}
    </aside>
  );
}
