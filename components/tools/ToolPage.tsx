"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, FolderOpen, Loader2, Printer, Save, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { TOOL_DEFS } from "./index";

/** Form on the left, live printable document on the right, save/print on top. */
export function ToolPage({ slug }: { slug: string }) {
  const info = TOOL_BY_SLUG[slug];
  const def = TOOL_DEFS[slug];
  const { profile } = useAuth();
  const docParam = useSearchParams().get("doc");
  const [data, setData] = useState(() => def.initial());
  const [docId, setDocId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Reopen a saved document for editing (?doc=<id>).
  useEffect(() => {
    if (!docParam || !profile) return;
    fetch(`/api/documents/${docParam}`).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d?.document?.tool === slug) { setData(d.document.data); setDocId(d.document.id); setTitle(d.document.title); }
    });
  }, [docParam, profile, slug]);

  const edit = (next: typeof data) => { setData(next); if (status === "saved") setStatus("idle"); };

  const save = async () => {
    setStatus("saving"); setError(null);
    const body = JSON.stringify({ tool: slug, title: title.trim() || def.titleOf(data), data });
    const res = docId
      ? await fetch(`/api/documents/${docId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body })
      : await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setStatus("error"); setError(d.error || "Couldn't save."); return; }
    if (!docId && d.id) { setDocId(d.id); window.history.replaceState(null, "", `?doc=${d.id}`); }
    setStatus("saved");
  };

  const Editor = def.Editor, Doc = def.Doc;
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 w-full">
      <div className="no-print">
        <Link href="/tools" className="text-[13px] text-[#9A968A] hover:text-[#26364A]">&larr; Free tools</Link>
        <h1 className="text-[26px] font-semibold text-[#1C1B19] mt-2 mb-1.5 leading-snug">{info.title}</h1>
        <p className="text-[14px] text-[#5B584F] leading-relaxed mb-1.5 max-w-2xl">{info.blurb}</p>
        <p className="text-[12px] text-[#217A78] flex items-center gap-1.5 mb-7">
          <ShieldCheck size={13} /> Nothing is stored unless you save it to your documents, which only you can see.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="no-print"><Editor data={data} set={edit} /></div>

        <div>
          <div className="no-print flex flex-wrap items-center gap-2 mb-2">
            {profile ? (
              <>
                <input value={title} onChange={(e) => { setTitle(e.target.value); if (status === "saved") setStatus("idle"); }}
                  placeholder={def.titleOf(data)} className="flex-1 min-w-[160px] px-2.5 py-1.5 border border-[#E6E3DA] bg-white text-[13px] outline-none focus:border-[#26364A]" />
                <button onClick={save} disabled={status === "saving"}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold bg-[#26364A] text-white hover:bg-[#1e2c3d] disabled:opacity-50">
                  {status === "saving" ? <Loader2 size={14} className="animate-spin" /> : status === "saved" ? <Check size={14} /> : <Save size={14} />}
                  {status === "saved" ? "Saved" : docId ? "Save changes" : "Save to my documents"}
                </button>
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold bg-[#26364A] text-white hover:bg-[#1e2c3d]">
                <Save size={14} /> Log in to save
              </Link>
            )}
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium border border-[#E6E3DA] bg-white hover:bg-[#FAF9F7]">
              <Printer size={14} /> Print
            </button>
            {profile && (
              <Link href="/documents" className="flex items-center gap-1.5 px-2 py-1.5 text-[13px] text-[#5B584F] hover:text-[#26364A]">
                <FolderOpen size={14} /> My documents
              </Link>
            )}
          </div>
          {error && <p className="no-print text-[12px] text-[#B23B3B] mb-2">{error}</p>}
          <div className="print-area bg-white border border-[#E6E3DA] p-6 min-h-[420px]"><Doc data={data} /></div>
        </div>
      </div>

      <div className="no-print mt-12 p-6 bg-[#F5EFDD] border border-[#E6D6AE]">
        <h2 className="text-[16px] font-semibold text-[#1C1B19] mb-1">Have a question this tool doesn&apos;t answer?</h2>
        <p className="text-[14px] text-[#5B584F] leading-relaxed mb-4">Ask parents who&apos;ve been through it, and Verified Experts who do this every day. It&apos;s free.</p>
        <Link href={profile ? "/" : "/signup"} className="inline-block text-[14px] font-semibold text-white bg-[#26364A] px-5 py-2.5 hover:bg-[#1C2836]">Ask the Recess community</Link>
      </div>
    </div>
  );
}
