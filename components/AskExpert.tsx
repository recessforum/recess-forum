"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Check, Loader2, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./Avatar";

interface Expert { id: string; displayName: string; avatarUrl: string | null; expertType: string | null; bio: string | null }

async function askExpert(postId: string, expertId: string): Promise<string | null> {
  const res = await fetch(`/api/posts/${postId}/ask-expert`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expertId }),
  });
  if (res.ok) return null;
  return (await res.json().catch(() => ({}))).error || "Couldn't send your request.";
}

function Modal({ title, sub, onClose, children }: { title: string; sub: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(28,27,25,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-md max-h-[85vh] flex flex-col bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#E6E3DA]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1C1B19]">{title}</h2>
            <p className="text-[12px] text-[#9A968A] mt-0.5 leading-snug">{sub}</p>
          </div>
          <button onClick={onClose} className="text-[#9A968A] hover:text-[#1C1B19]" aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** On your own post: pick Verified Experts to ask. Each one gets an email with a link. */
export function AskExpertButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [asked, setAsked] = useState<{ expertId: string; name: string }[]>([]);
  useEffect(() => {
    fetch(`/api/posts/${postId}/ask-expert`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setAsked(d.asked));
  }, [postId]);

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold border border-[#BFE0DE] bg-[#E4F2F1] text-[#217A78] hover:bg-[#D6ECEA] transition-colors">
        <BadgeCheck size={14} /> Ask a Verified Expert
      </button>
      {asked.length > 0 && <span className="text-[12px] text-[#5B584F]">Asked: {asked.map((a) => a.name).join(", ")}</span>}
      {open && <ExpertPicker postId={postId} asked={asked} onAsked={(a) => setAsked((x) => [...x, a])} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ExpertPicker({ postId, asked, onAsked, onClose }: {
  postId: string; asked: { expertId: string }[]; onAsked: (a: { expertId: string; name: string }) => void; onClose: () => void;
}) {
  const [experts, setExperts] = useState<Expert[] | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/experts").then((r) => r.json()).then((d) => setExperts(d.experts ?? [])); }, []);

  const shown = (experts ?? []).filter((e) => !q.trim() || `${e.displayName} ${e.expertType ?? ""} ${e.bio ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()));
  const ask = async (e: Expert) => {
    setBusy(e.id); setError(null);
    const err = await askExpert(postId, e.id);
    if (err) setError(err); else onAsked({ expertId: e.id, name: e.displayName });
    setBusy(null);
  };

  return (
    <Modal title="Ask a Verified Expert" sub="We'll email them a link to your question. You can ask up to 3 experts." onClose={onClose}>
      <div className="px-5 pt-3">
        <label className="flex items-center gap-2 border border-[#E6E3DA] bg-[#FAF9F7] px-2.5 py-2">
          <Search size={14} className="text-[#9A968A]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or field (IEP, college, speech...)"
            className="flex-1 bg-transparent text-[13px] outline-none" />
        </label>
        {error && <p className="text-[12px] text-[#B23B3B] mt-2">{error}</p>}
      </div>
      <div className="overflow-y-auto px-5 py-3 flex flex-col gap-2">
        {!experts ? <p className="text-[13px] text-[#9A968A] flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading...</p>
          : shown.length === 0 ? <p className="text-[13px] text-[#9A968A]">No experts match that search.</p>
          : shown.map((e) => {
            const done = asked.some((a) => a.expertId === e.id);
            return (
              <div key={e.id} className="flex items-start gap-3 border border-[#EFEDE6] px-3 py-2.5">
                <Avatar url={e.avatarUrl} name={e.displayName} size={36} />
                <div className="flex-1 min-w-0">
                  <Link href={`/u/${e.id}`} target="_blank" className="text-[14px] font-semibold text-[#1C1B19] hover:underline">{e.displayName}</Link>
                  {e.expertType && <p className="text-[12px] text-[#217A78]">{e.expertType}</p>}
                  {e.bio && <p className="text-[12px] text-[#5B584F] leading-snug mt-0.5 line-clamp-2">{e.bio}</p>}
                </div>
                <button disabled={done || busy !== null} onClick={() => ask(e)}
                  className="shrink-0 px-3 py-1.5 text-[12px] font-semibold bg-[#26364A] text-white disabled:opacity-50 inline-flex items-center gap-1">
                  {busy === e.id ? <Loader2 size={12} className="animate-spin" /> : done ? <Check size={12} /> : null} {done ? "Asked" : "Ask"}
                </button>
              </div>
            );
          })}
      </div>
    </Modal>
  );
}

/** On an expert's profile: send one of your own questions to this expert. */
export function AskThisExpertButton({ expertId, expertName, viewerId }: { expertId: string; expertName: string; viewerId: string | null }) {
  const [open, setOpen] = useState(false);
  if (viewerId === expertId) return null;
  return (
    <>
      {viewerId ? (
        <button onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold bg-[#217A78] text-white hover:bg-[#1B6664] transition-colors">
          <BadgeCheck size={14} /> Ask {expertName} a question
        </button>
      ) : (
        <Link href="/login" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold bg-[#217A78] text-white hover:bg-[#1B6664]">
          <BadgeCheck size={14} /> Log in to ask {expertName}
        </Link>
      )}
      {open && viewerId && <MyQuestionPicker expertId={expertId} expertName={expertName} viewerId={viewerId} onClose={() => setOpen(false)} />}
    </>
  );
}

function MyQuestionPicker({ expertId, expertName, viewerId, onClose }: { expertId: string; expertName: string; viewerId: string; onClose: () => void }) {
  const [posts, setPosts] = useState<{ id: string; title: string }[] | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    createClient().from("posts").select("id, title").eq("author_id", viewerId).order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => setPosts(data ?? []));
  }, [viewerId]);

  const send = async (postId: string) => {
    setBusy(postId); setError(null);
    const err = await askExpert(postId, expertId);
    if (err) setError(err); else setSent((s) => [...s, postId]);
    setBusy(null);
  };

  return (
    <Modal title={`Ask ${expertName}`} sub="Pick one of your questions. We'll email them a link so they can answer on the forum." onClose={onClose}>
      <div className="overflow-y-auto px-5 py-3 flex flex-col gap-2">
        {error && <p className="text-[12px] text-[#B23B3B]">{error}</p>}
        {!posts ? <p className="text-[13px] text-[#9A968A] flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading...</p>
          : posts.length === 0 ? (
            <p className="text-[13px] text-[#5B584F] leading-relaxed">
              You haven&apos;t posted a question yet. <Link href="/" className="text-[#26364A] font-medium hover:underline">Start a discussion</Link>, then come back here or tap &quot;Ask a Verified Expert&quot; on your post.
            </p>
          ) : posts.map((p) => {
            const done = sent.includes(p.id);
            return (
              <div key={p.id} className="flex items-center gap-3 border border-[#EFEDE6] px-3 py-2.5">
                <p className="flex-1 text-[13px] font-medium text-[#1C1B19] leading-snug">{p.title}</p>
                <button disabled={done || busy !== null} onClick={() => send(p.id)}
                  className="shrink-0 px-3 py-1.5 text-[12px] font-semibold bg-[#26364A] text-white disabled:opacity-50 inline-flex items-center gap-1">
                  {busy === p.id ? <Loader2 size={12} className="animate-spin" /> : done ? <Check size={12} /> : null} {done ? "Sent" : "Send"}
                </button>
              </div>
            );
          })}
      </div>
    </Modal>
  );
}
