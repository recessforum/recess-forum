"use client";

import { useEffect, useState } from "react";
import { Download, Sparkles } from "lucide-react";
import type { FoundingStatus } from "@/lib/founding";

const EXPORTS = [
  { scope: "founding", label: "Founding Parents" },
  { scope: "parents", label: "All parents" },
  { scope: "providers", label: "Business / service providers" },
  { scope: "unset", label: "Not chosen yet" },
] as const;

/** Admin-only: Founding Parent progress plus CSV downloads of member emails,
 *  for announcement emails sent from a mail tool. */
export function MemberEmailExport() {
  const [status, setStatus] = useState<FoundingStatus | null>(null);

  useEffect(() => {
    fetch("/api/founding-status").then((r) => (r.ok ? r.json() : null)).then(setStatus).catch(() => {});
  }, []);

  return (
    <div className="mb-10 border border-[#E6E3DA] bg-white p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles size={13} className="text-[#B08D45]" /> Founding Parents &amp; member emails
        </h2>
        {status && (
          <span className="text-[13px] text-[#1C1B19] tabular-nums">
            <strong>{status.filled}</strong> / {status.cap} founding spots taken
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {EXPORTS.map(({ scope, label }) => (
          <a key={scope} href={`/api/admin/member-emails?scope=${scope}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#26364A] border border-[#E6E3DA] hover:border-[#26364A] transition-colors">
            <Download size={14} /> {label} (CSV)
          </a>
        ))}
      </div>
      <p className="text-[11px] text-[#9A968A] mt-3">
        Columns: founding number, nickname, email, account type, join date. Send from a mail tool that adds an unsubscribe link, and keep the list private.
      </p>
    </div>
  );
}
