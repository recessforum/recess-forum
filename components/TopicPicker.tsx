"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { CATEGORIES, colorForCategory } from "@/lib/taxonomy";
import { ALERT_CONSENT_TEXT, type TopicPrefs } from "@/lib/topic-alerts";

/** Pick one or more categories, plus the (unchecked by default) email opt-in. */
export function TopicPicker({ value, onChange }: { value: TopicPrefs; onChange: (v: TopicPrefs) => void }) {
  const toggle = (id: string) => {
    const categories = value.categories.includes(id)
      ? value.categories.filter((c) => c !== id)
      : [...value.categories, id];
    onChange({ ...value, categories });
  };

  return (
    <div>
      <p className="text-[12px] font-medium text-[#5B584F] mb-2">
        Topics you care about <span className="text-[#9A968A] font-normal">(pick at least one)</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => {
          const on = value.categories.includes(c.id);
          const col = colorForCategory(c.id);
          return (
            <button key={c.id} type="button" onClick={() => toggle(c.id)} aria-pressed={on}
              style={{ backgroundColor: on ? col.solid : col.bg, color: on ? "#FFFFFF" : col.text }}
              className="text-[12px] font-medium px-2.5 py-1.5 rounded-sm inline-flex items-center gap-1 transition-colors">
              {on && <Check size={12} />} {c.label}
            </button>
          );
        })}
      </div>

      <label className="flex items-start gap-2 mt-3 cursor-pointer">
        <input type="checkbox" checked={value.categoryEmails}
          onChange={(e) => onChange({ ...value, categoryEmails: e.target.checked })} className="mt-0.5 shrink-0" />
        <span className="text-[13px] text-[#5B584F] leading-snug">
          {ALERT_CONSENT_TEXT} <span className="text-[#9A968A]">(Optional. Up to 5 emails a day. See our{" "}
          <Link href="/privacy" target="_blank" className="text-[#26364A] hover:underline">Privacy Policy</Link>.)</span>
        </span>
      </label>
    </div>
  );
}
