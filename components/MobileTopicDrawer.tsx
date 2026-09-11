"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, Info, ListTree, MapPin, X } from "lucide-react";
import { CATEGORIES, colorForCategory, topicById, type Category, type Topic } from "@/lib/taxonomy";
import { US_STATES } from "@/lib/location";
import type { Post } from "@/lib/types";

const EDGE_SWIPE_THRESHOLD = 45;
const NEW_TAG_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

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

function CategoryGroup({
  cat, isNew, open, onToggle, selectedTopic, onSelectTopic,
}: {
  cat: Category; isNew: boolean; open: boolean; onToggle: () => void;
  selectedTopic: string | null; onSelectTopic: (id: string | null) => void;
}) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="mt-1">
      <div className="relative">
        <button onClick={onToggle} className="w-full flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-[#9A968A] tracking-wide">
          <span className="flex-1 text-left">{cat.label}</span>
          {isNew && <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-[#B23B3B] text-white tracking-wide">New</span>}
          {cat.tooltip && (
            <Info size={12} className="shrink-0" onClick={(e) => { e.stopPropagation(); setShowTip((v) => !v); }} />
          )}
          <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
        {cat.tooltip && showTip && (
          <div className="mx-4 mb-1.5 rounded-sm bg-[#1C1B19] px-2.5 py-2 text-[11px] leading-snug text-white">
            {cat.tooltip}
          </div>
        )}
      </div>
      {open && (
        <div className="flex flex-col">
          {cat.topics.map((t) => (
            <TopicRow key={t.id} topic={t} categoryId={cat.id} active={selectedTopic === t.id} onClick={() => onSelectTopic(selectedTopic === t.id ? null : t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MobileTopicDrawer({
  selectedTopic, onSelectTopic, selectedState, onSelectState, posts,
}: {
  selectedTopic: string | null;
  onSelectTopic: (topicId: string | null) => void;
  selectedState: string | null;
  onSelectState: (state: string | null) => void;
  posts: Post[] | null;
}) {
  const [open, setOpen] = useState(false);
  const [openCat, setOpenCat] = useState<Set<string>>(() => new Set());
  const [editingState, setEditingState] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

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

  const activeTopic = selectedTopic ? topicById(selectedTopic) : null;

  const onEdgeTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onEdgeTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    if (dx > EDGE_SWIPE_THRESHOLD && Math.abs(dy) < 40) {
      setOpen(true);
      touchStart.current = null;
    }
  };

  const onPanelTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onPanelTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    if (dx < -EDGE_SWIPE_THRESHOLD && Math.abs(dy) < 40) {
      setOpen(false);
      touchStart.current = null;
    }
  };
  const onTouchEnd = () => { touchStart.current = null; };

  return (
    <>
      <div className="drawer:hidden mb-3">
        <button onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-[#26364A] text-white text-[13px] shadow-sm">
          <span className="flex items-center gap-2 font-semibold truncate">
            <ListTree size={16} className="shrink-0" />
            {activeTopic ? activeTopic.label : "Browse topics"}
          </span>
          <ChevronDown size={14} className="shrink-0 opacity-80" />
        </button>
      </div>

      {!open && (
        <div className="drawer:hidden fixed left-0 top-0 bottom-0 w-6 z-40"
          onTouchStart={onEdgeTouchStart} onTouchMove={onEdgeTouchMove} onTouchEnd={onTouchEnd} />
      )}

      {open && (
        <div className="fixed inset-0 z-50 drawer:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div
            onTouchStart={onPanelTouchStart} onTouchMove={onPanelTouchMove} onTouchEnd={onTouchEnd}
            className="absolute left-0 top-0 bottom-0 w-[82%] max-w-[320px] bg-[#F7F6F3] overflow-y-auto flex flex-col shadow-xl">
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

              <div className="px-4 pt-3 text-[11px] font-semibold text-[#9A968A] tracking-wide">NATIONWIDE</div>
              {nationwide.map((cat) => (
                <CategoryGroup key={cat.id} cat={cat} isNew={recentCategoryIds.has(cat.id)} open={openCat.has(cat.id)}
                  onToggle={() => toggle(cat.id)} selectedTopic={selectedTopic}
                  onSelectTopic={(id) => { onSelectTopic(id); setOpen(false); }} />
              ))}

              <div className="px-4 pt-3 text-[11px] font-semibold text-[#9A968A] tracking-wide">LOCAL</div>
              <div className="px-4 py-2">
                {selectedState && !editingState ? (
                  <button onClick={() => setEditingState(true)} className="flex items-center gap-1.5 text-[12px]">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#EFEDE6] text-[#3A382F] font-medium">
                      <MapPin size={11} /> {stateName} <ChevronDown size={10} />
                    </span>
                    <span className="text-[10px] text-[#9A968A] italic">saved for next visit</span>
                  </button>
                ) : (
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
                )}
              </div>
              {local.map((cat) => (
                <CategoryGroup key={cat.id} cat={cat} isNew={recentCategoryIds.has(cat.id)} open={openCat.has(cat.id)}
                  onToggle={() => toggle(cat.id)} selectedTopic={selectedTopic}
                  onSelectTopic={(id) => { onSelectTopic(id); setOpen(false); }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
