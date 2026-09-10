"use client";

import { useState } from "react";
import { Ban, Flag, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ReportModal } from "./ReportModal";

export function AuthorMenu({
  targetType,
  targetId,
  authorId,
  authorName,
  onBlocked,
}: {
  targetType: "post" | "comment";
  targetId: string;
  authorId: string;
  authorName: string;
  onBlocked?: () => void;
}) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);

  if (!profile || profile.id === authorId) return null;

  const submitReport = async (reason: string) => {
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason }),
    });
  };

  const block = async () => {
    setOpen(false);
    if (!confirm(`Block ${authorName}? You won't see their posts or comments anymore. You can undo this from Settings.`)) return;
    await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: authorId }),
    });
    onBlocked?.();
  };

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((o) => !o)} className="p-1 text-[#9A968A] hover:text-[#1C1B19]" aria-label="More options">
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E6E3DA] shadow-md z-20 py-1">
            <button onClick={() => { setOpen(false); setShowReport(true); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#5B584F] hover:bg-[#FAF9F7] hover:text-[#1C1B19] text-left">
              <Flag size={13} /> Report
            </button>
            <button onClick={block}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#5B584F] hover:bg-[#FAF9F7] hover:text-[#B23B3B] text-left">
              <Ban size={13} /> Block {authorName}
            </button>
          </div>
        </>
      )}
      {showReport && (
        <ReportModal targetLabel={targetType === "post" ? "post" : "comment"} onClose={() => setShowReport(false)} onSubmit={submitReport} />
      )}
    </div>
  );
}
