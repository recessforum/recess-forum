"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

const REASONS = ["Spam", "Harassment or bullying", "Misinformation", "Inappropriate content", "Other"];

export function ReportModal({
  targetLabel,
  onClose,
  onSubmit,
}: {
  targetLabel: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const inputClass = "w-full px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] transition-colors";

  const submit = async () => {
    setSending(true);
    const finalReason = reason === "Other" && details.trim() ? details.trim() : reason;
    await onSubmit(finalReason);
    setSending(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(28,27,25,0.55)" }}>
        <div className="w-full max-w-sm p-6 text-center bg-[#F7F6F3] border border-[#E6E3DA]">
          <p className="text-[15px] font-semibold text-[#1C1B19] mb-1.5">Thanks for the report</p>
          <p className="text-[13px] text-[#5B584F] mb-5">An admin will take a look.</p>
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-semibold bg-[#26364A] text-white hover:bg-[#1e2c3d] transition-colors">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(28,27,25,0.55)" }}>
      <div className="w-full max-w-sm bg-[#F7F6F3] border border-[#E6E3DA]">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E6E3DA]">
          <h2 className="text-[15px] font-semibold text-[#1C1B19]">Report {targetLabel}</h2>
          <button onClick={onClose} className="text-[#9A968A] hover:text-[#1C1B19]"><X size={17} /></button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass}>
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {reason === "Other" && (
            <div>
              <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Details</label>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3}
                className={`${inputClass} resize-none`} placeholder="What's going on?" />
            </div>
          )}
        </div>
        <div className="px-5 py-3.5 flex justify-end gap-2 border-t border-[#E6E3DA]">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-[#5B584F] hover:text-[#1C1B19]">Cancel</button>
          <button disabled={sending} onClick={submit}
            className="px-4 py-2 text-[13px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-2 hover:bg-[#1e2c3d] transition-colors">
            {sending && <Loader2 size={13} className="animate-spin" />} Submit report
          </button>
        </div>
      </div>
    </div>
  );
}
