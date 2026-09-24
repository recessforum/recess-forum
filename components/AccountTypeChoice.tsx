"use client";

import { Briefcase, Sparkles, Users } from "lucide-react";
import type { AccountType } from "@/lib/account-type";

const OPTIONS: { type: AccountType; label: string; hint: string; icon: typeof Users }[] = [
  { type: "parent", label: "I'm a parent", hint: "Or a guardian or caregiver", icon: Users },
  { type: "provider", label: "Business / service provider", hint: "Tutor, counselor, therapist, school, etc.", icon: Briefcase },
];

export function AccountTypeChoice({ value, onChange }: { value: AccountType | null; onChange: (t: AccountType) => void }) {
  return (
    <div>
      <div className="text-[12px] font-medium text-[#5B584F] mb-1.5">Which describes you?</div>
      <div className="grid grid-cols-2 gap-2" role="radiogroup">
        {OPTIONS.map(({ type, label, hint, icon: Icon }) => {
          const selected = value === type;
          return (
            <button key={type} type="button" role="radio" aria-checked={selected} onClick={() => onChange(type)}
              className={`flex flex-col items-start justify-start text-left px-3 py-2.5 border transition-colors ${selected ? "border-[#26364A] bg-white ring-1 ring-[#26364A]" : "border-[#E6E3DA] bg-[#FAF9F7] hover:border-[#26364A]"}`}>
              <Icon size={15} className={selected ? "text-[#26364A]" : "text-[#9A968A]"} />
              <div className="text-[13px] font-semibold text-[#1C1B19] mt-1 leading-tight">{label}</div>
              <div className="text-[11px] text-[#9A968A] mt-0.5 leading-snug">{hint}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-2.5 text-[12px] leading-relaxed text-[#5B584F]">
        <p className="flex items-start gap-1.5">
          <Sparkles size={12} className="text-[#B08D45] mt-[3px] shrink-0" />
          <span>The first 500 parents to join get a permanent <strong className="text-[#1C1B19]">Founding Parent</strong> badge.</span>
        </p>
        <p className="mt-1 text-[#9A968A]">We welcome business/service providers for educational purposes.</p>
      </div>
    </div>
  );
}
