"use client";

import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";

/* Small shared inputs so every tool looks and behaves the same. */

export const inputClass = "w-full px-3 py-2 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] transition-colors";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[#9A968A] mt-1">{hint}</p>}
    </div>
  );
}

export function Text({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function Area({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea className={inputClass} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Chips({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button key={o} type="button" aria-pressed={on} onClick={() => onToggle(o)}
            className={`text-[12px] font-medium px-2.5 py-1.5 rounded-sm transition-colors ${on ? "bg-[#26364A] text-white" : "bg-[#EFEDE6] text-[#5B584F] hover:bg-[#E6E3DA]"}`}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="self-start flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border border-dashed border-[#C9C4B6] text-[#5B584F] hover:border-[#26364A]">
      <Plus size={14} /> {children}
    </button>
  );
}

export function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" aria-label="Remove" onClick={onClick} className="p-2 text-[#9A968A] hover:text-[#B23B3B] shrink-0">
      <Trash2 size={15} />
    </button>
  );
}

/** Immutable list helpers for editor state. */
export const setAt = <T,>(xs: T[], i: number, patch: Partial<T>): T[] => xs.map((x, j) => (j === i ? { ...x, ...patch } : x));
export const removeAt = <T,>(xs: T[], i: number): T[] => xs.filter((_, j) => j !== i);

/* Document building blocks (print-friendly, used on screen and on paper). */
export function DocTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-[20px] font-semibold text-[#1C1B19] leading-snug">{children}</h2>
      {sub && <p className="text-[13px] text-[#5B584F] mt-1">{sub}</p>}
    </div>
  );
}

export function DocTable({ head, rows, foot }: { head: string[]; rows: ReactNode[][]; foot?: ReactNode[] }) {
  return (
    <table className="w-full text-[13px] border-collapse">
      <thead>
        <tr>{head.map((h, i) => <th key={i} className="text-left font-semibold text-[#5B584F] border-b-2 border-[#1C1B19] py-1.5 pr-3">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border-b border-[#E6E3DA] py-1.5 pr-3 align-top">{c}</td>)}</tr>)}
      </tbody>
      {foot && <tfoot><tr>{foot.map((c, j) => <td key={j} className="pt-2 pr-3 font-semibold">{c}</td>)}</tr></tfoot>}
    </table>
  );
}

export const Letter = ({ text }: { text: string }) => (
  <pre className="whitespace-pre-wrap font-serif text-[14px] leading-relaxed text-[#1C1B19]">{text}</pre>
);

export const todayLong = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
export const fmtDate = (iso: string) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "");
