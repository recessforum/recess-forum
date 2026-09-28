import Link from "next/link";
import { FileText, GraduationCap } from "lucide-react";

export const metadata = {
  title: "Free Tools for Parents",
  description: "Free tools from Recess Forum: an IEP evaluation request letter generator and an Early Decision plan checker.",
};

const TOOLS = [
  {
    href: "/tools/iep-letter", icon: FileText, title: "IEP evaluation request letter",
    blurb: "Write a clear, formal letter asking the school to evaluate your child for special education. Ready to copy or print.",
  },
  {
    href: "/tools/early-decision", icon: GraduationCap, title: "Early Decision plan checker",
    blurb: "ED, EA, REA, ED II: list your colleges and see which combinations usually work before November 1.",
  },
];

export default function ToolsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 w-full">
      <h1 className="text-[26px] font-semibold text-[#1C1B19] mb-2">Free tools for parents</h1>
      <p className="text-[14px] text-[#5B584F] mb-8">Small, practical helpers for the moments parents ask about most. Free, and nothing you type is saved.</p>
      <div className="flex flex-col gap-3">
        {TOOLS.map(({ href, icon: Icon, title, blurb }) => (
          <Link key={href} href={href} className="flex items-start gap-4 p-5 border border-[#E6E3DA] bg-white hover:border-[#26364A] transition-colors">
            <div className="w-10 h-10 shrink-0 grid place-items-center bg-[#F5EFDD] text-[#B08D45]"><Icon size={20} /></div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#1C1B19] mb-1">{title}</h2>
              <p className="text-[13px] text-[#5B584F] leading-relaxed">{blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
