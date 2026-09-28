"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Link2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { timeAgo } from "@/lib/ranking";

interface Row { id: string; tool: string; title: string; shared: boolean; updatedAt: number }

export default function DocumentsPage() {
  const { profile, loading } = useAuth();
  const [docs, setDocs] = useState<Row[] | null>(null);
  useEffect(() => { if (profile) fetch("/api/documents").then((r) => r.json()).then((d) => setDocs(d.documents ?? [])); }, [profile]);

  if (!loading && !profile) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1C1B19] mb-2">Log in to see your documents</p>
        <Link href="/login" className="text-[14px] font-medium text-[#26364A] hover:underline">Log in</Link>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 w-full">
      <h1 className="text-[24px] font-semibold text-[#1C1B19] mb-1">My documents</h1>
      <p className="text-[13px] text-[#9A968A] mb-6">Letters, transcripts, and checklists you saved from the <Link href="/tools" className="text-[#26364A] hover:underline">free tools</Link>. Only you can see them unless you share a link.</p>
      {docs === null ? (
        <p className="text-[14px] text-[#9A968A] flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Loading...</p>
      ) : docs.length === 0 ? (
        <div className="p-6 border border-dashed border-[#C9C4B6] text-center">
          <p className="text-[14px] text-[#5B584F] mb-3">Nothing saved yet.</p>
          <Link href="/tools" className="inline-block text-[14px] font-semibold text-white bg-[#26364A] px-4 py-2">Browse free tools</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {docs.map((d) => (
            <Link key={d.id} href={`/documents/${d.id}`} className="flex items-center gap-3 p-4 border border-[#E6E3DA] bg-white hover:border-[#26364A]">
              <FileText size={18} className="text-[#B08D45] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-[#1C1B19] truncate">{d.title}</p>
                <p className="text-[12px] text-[#9A968A]">{TOOL_BY_SLUG[d.tool]?.title ?? d.tool} · updated {timeAgo(d.updatedAt)} ago</p>
              </div>
              {d.shared && <span className="text-[11px] font-medium text-[#217A78] flex items-center gap-1"><Link2 size={12} /> Shared</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
