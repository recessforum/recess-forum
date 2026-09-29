"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { TOOL_DEFS } from "@/components/tools";

/* Print view used by the mobile app (see lib/print.ts). Reads the document
   from the URL fragment, renders it, and opens the print dialog. */
export default function PrintPage() {
  const { slug } = useParams<{ slug: string }>();
  // The document lives in the URL fragment (never sent to the server).
  const hash = useSyncExternalStore(
    (cb) => { window.addEventListener("hashchange", cb); return () => window.removeEventListener("hashchange", cb); },
    () => window.location.hash,
    () => null,
  );
  const data = useMemo(() => {
    if (hash === null) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(hash.slice(1)));
      return parsed && typeof parsed === "object" && TOOL_DEFS[slug] ? parsed : false;
    } catch {
      return false;
    }
  }, [hash, slug]);
  const bad = data === false;

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [data]);

  if (bad) return <p className="max-w-xl mx-auto px-6 py-16 text-[14px] text-[#5B584F]">Nothing to print. Go back to the tool and tap Print again.</p>;
  if (!data) return null;
  const Doc = TOOL_DEFS[slug].Doc;
  return (
    <div className="max-w-3xl mx-auto px-5 py-6 w-full">
      <div className="no-print flex items-center justify-between gap-3 mb-4">
        <p className="text-[13px] text-[#5B584F]">{TOOL_BY_SLUG[slug]?.title}</p>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 text-[14px] font-semibold bg-[#26364A] text-white">
          <Printer size={15} /> Print or save as PDF
        </button>
      </div>
      <div className="print-area bg-white border border-[#E6E3DA] p-6"><Doc data={data} /></div>
      <p className="no-print text-[12px] text-[#9A968A] mt-3">Tip: in the print screen you can also save it as a PDF or share it. Close this window to go back.</p>
    </div>
  );
}
