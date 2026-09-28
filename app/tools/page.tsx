import Link from "next/link";
import { TOOLS, TOOL_GROUPS } from "@/lib/tools";

export const metadata = {
  title: "Free Tools for Parents",
  description: "Free tools from Recess Forum: IEP letters and accommodations, homeschool transcripts and NY IHIP, GPA, financial aid comparison, college deadlines, and more.",
};

export default function ToolsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 w-full">
      <h1 className="text-[26px] font-semibold text-[#1C1B19] mb-2">Free tools for parents</h1>
      <p className="text-[14px] text-[#5B584F] mb-10 max-w-2xl">
        Practical helpers for the moments parents ask about most. Free to use. Log in to save what you make to your private documents, then print or share it.
      </p>
      {TOOL_GROUPS.map((g) => (
        <section key={g} className="mb-10">
          <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-3">{g}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {TOOLS.filter((t) => t.group === g).map((t) => (
              <Link key={t.slug} href={`/tools/${t.slug}`} className="p-4 border border-[#E6E3DA] bg-white hover:border-[#26364A] transition-colors">
                <h3 className="text-[15px] font-semibold text-[#1C1B19] mb-1">{t.title}</h3>
                <p className="text-[13px] text-[#5B584F] leading-relaxed">{t.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
