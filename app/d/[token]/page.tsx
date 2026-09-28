import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { SharedDoc } from "./SharedDoc";

export const metadata: Metadata = { title: "Shared document", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SharedDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = UUID.test(token) ? await supabase.rpc("get_shared_document", { p_token: token }) : { data: null };
  const doc = Array.isArray(data) ? data[0] : null;
  if (!doc || !TOOL_BY_SLUG[doc.tool]) {
    return <div className="max-w-2xl mx-auto px-6 py-16 text-center text-[14px] text-[#5B584F]">This link isn&apos;t active. The owner may have turned sharing off.</div>;
  }
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 w-full">
      <p className="no-print text-[12px] text-[#9A968A] mb-3">Shared with you · made with the free <Link href={`/tools/${doc.tool}`} className="text-[#26364A] underline">{TOOL_BY_SLUG[doc.tool].title}</Link> on Recess Forum</p>
      <SharedDoc tool={doc.tool} data={doc.data} />
    </div>
  );
}
