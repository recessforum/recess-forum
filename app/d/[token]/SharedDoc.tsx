"use client";

import { Printer } from "lucide-react";
import { TOOL_DEFS } from "@/components/tools";

export function SharedDoc({ tool, data }: { tool: string; data: unknown }) {
  const Doc = TOOL_DEFS[tool].Doc;
  return (
    <>
      <button onClick={() => window.print()} className="no-print flex items-center gap-1.5 px-3 py-1.5 mb-3 text-[13px] font-semibold bg-[#26364A] text-white"><Printer size={14} /> Print</button>
      <div className="print-area bg-white border border-[#E6E3DA] p-6"><Doc data={data} /></div>
    </>
  );
}
