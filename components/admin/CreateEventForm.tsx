"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { CATEGORIES } from "@/lib/taxonomy";
import { US_STATES } from "@/lib/location";

/** Admin: schedule Office Hours (creates the Q&A thread and the time window). */
export function CreateEventForm() {
  const [experts, setExperts] = useState<{ id: string; displayName: string; expertType: string | null }[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hostId, setHostId] = useState("");
  const [topicId, setTopicId] = useState("special-ed");
  const [state, setState] = useState("CA");
  const [start, setStart] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; postId?: string } | null>(null);

  useEffect(() => { fetch("/api/experts").then((r) => r.json()).then((d) => setExperts(d.experts ?? [])); }, []);

  const submit = async () => {
    setSaving(true); setResult(null);
    const startsAt = new Date(start);
    const res = await fetch("/api/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, hostId: hostId || null, topicId, state,
        startsAt: startsAt.toISOString(), endsAt: new Date(+startsAt + minutes * 60000).toISOString() }),
    });
    const d = await res.json().catch(() => ({}));
    setResult(res.ok ? { ok: true, text: "Office Hours created.", postId: d.event.postId } : { ok: false, text: d.error || "Couldn't create." });
    setSaving(false);
  };

  const input = "w-full px-3 py-2 border border-[#E6E3DA] bg-white text-[13px] outline-none focus:border-[#26364A]";
  return (
    <div className="border border-[#E6E3DA] bg-[#FAF9F7] p-4 mb-8">
      <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-3">Schedule Office Hours</h2>
      <div className="grid sm:grid-cols-2 gap-2.5">
        <input className={`${input} sm:col-span-2`} placeholder="Title, e.g. IEP questions before fall meetings" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className={`${input} sm:col-span-2 min-h-[60px]`} placeholder="Short description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <select className={input} value={hostId} onChange={(e) => setHostId(e.target.value)}>
          <option value="">Host: none / team</option>
          {experts.map((x) => <option key={x.id} value={x.id}>{x.displayName}{x.expertType ? ` · ${x.expertType}` : ""}</option>)}
        </select>
        <select className={input} value={topicId} onChange={(e) => setTopicId(e.target.value)}>
          {CATEGORIES.map((c) => <optgroup key={c.id} label={c.label}>{c.topics.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</optgroup>)}
        </select>
        <input type="datetime-local" className={input} value={start} onChange={(e) => setStart(e.target.value)} />
        <div className="flex gap-2">
          <select className={input} value={minutes} onChange={(e) => setMinutes(+e.target.value)}>
            {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
          <select className={input} value={state} onChange={(e) => setState(e.target.value)} title="Post location">
            {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button onClick={submit} disabled={saving || title.trim().length < 3 || !start}
          className="px-3 py-2 text-[13px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />} Create
        </button>
        <span className="text-[12px] text-[#9A968A]">Time is in your local time zone.</span>
        {result && (
          <span className={`text-[12px] ${result.ok ? "text-[#217A78]" : "text-[#B23B3B]"}`}>
            {result.text} {result.postId && <Link className="underline" href={`/post/${result.postId}`}>Open thread</Link>}
          </span>
        )}
      </div>
    </div>
  );
}
