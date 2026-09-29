"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, Copy, Loader2, Pencil, Printer, Trash2 } from "lucide-react";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { TOOL_DEFS } from "@/components/tools";
import { printDocument } from "@/lib/print";

interface Doc { id: string; tool: string; title: string; data: unknown; shareToken: string | null }

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/documents/${id}`).then((r) => (r.ok ? r.json() : null)).then((d) => (d ? setDoc(d.document) : setMissing(true)));
  }, [id]);

  if (missing) return <div className="max-w-2xl mx-auto px-6 py-16 text-center text-[14px] text-[#5B584F]">Document not found. <Link href="/documents" className="text-[#26364A] underline">My documents</Link></div>;
  if (!doc) return <div className="max-w-2xl mx-auto px-6 py-16 flex justify-center"><Loader2 size={18} className="animate-spin text-[#9A968A]" /></div>;

  const def = TOOL_DEFS[doc.tool];
  const shareUrl = doc.shareToken ? `https://www.recessforum.com/d/${doc.shareToken}` : null;
  const setShare = async (on: boolean) => {
    setBusy(true);
    const r = await fetch(`/api/documents/${id}/share`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on }) });
    const d = await r.json();
    setDoc({ ...doc, shareToken: d.shareToken ?? null });
    setBusy(false);
  };
  const copy = async () => { if (!shareUrl) return; await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const remove = async () => {
    if (!confirm("Delete this document? This can't be undone.")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    router.push("/documents");
  };
  const Doc = def?.Doc;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 w-full">
      <div className="no-print">
        <Link href="/documents" className="text-[13px] text-[#9A968A] hover:text-[#26364A]">&larr; My documents</Link>
        <h1 className="text-[22px] font-semibold text-[#1C1B19] mt-2">{doc.title}</h1>
        <p className="text-[12px] text-[#9A968A] mb-4">{TOOL_BY_SLUG[doc.tool]?.title}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => printDocument(doc.tool, doc.data)} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold bg-[#26364A] text-white"><Printer size={14} /> Print</button>
          <Link href={`/tools/${doc.tool}?doc=${doc.id}`} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium border border-[#E6E3DA] bg-white"><Pencil size={14} /> Edit</Link>
          <button onClick={remove} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium border border-[#E6C9C9] text-[#B23B3B] bg-white"><Trash2 size={14} /> Delete</button>
        </div>
        <div className="p-3 border border-[#E6E3DA] bg-[#FAF9F7] mb-6 text-[13px]">
          <label className="flex items-center gap-2 font-medium text-[#1C1B19]">
            <input type="checkbox" checked={!!doc.shareToken} disabled={busy} onChange={(e) => setShare(e.target.checked)} />
            Share with a private link
          </label>
          <p className="text-[12px] text-[#9A968A] mt-1">Anyone with the link can view (not edit) this document, for example your child&apos;s teacher or your spouse. Turn it off anytime to disable the link.</p>
          {shareUrl && (
            <div className="flex gap-2 mt-2">
              <input readOnly value={shareUrl} className="flex-1 px-2 py-1.5 border border-[#E6E3DA] bg-white text-[12px]" />
              <button onClick={copy} className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold bg-[#217A78] text-white">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied" : "Copy"}</button>
            </div>
          )}
        </div>
      </div>
      <div className="print-area bg-white border border-[#E6E3DA] p-6">{Doc ? <Doc data={doc.data} /> : null}</div>
    </div>
  );
}
