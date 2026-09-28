"use client";

import { AddButton, DocTable, DocTitle, RemoveButton, inputClass, removeAt, setAt } from "./ui";
import type { ToolDef } from "./types";

interface School { name: string; coa: string; grants: string; loans: string; work: string; renewable: boolean }
interface D { schools: School[]; increase: string }

const n = (s: string) => Math.max(0, parseFloat(s.replace(/[$,]/g, "")) || 0);
const money = (x: number) => x.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const blank = (): School => ({ name: "", coa: "", grants: "", loans: "", work: "", renewable: true });

function calc(s: School, increase: number) {
  const coa = n(s.coa), grants = n(s.grants), loans = n(s.loans), work = n(s.work);
  const net = Math.max(0, coa - grants);
  const cash = Math.max(0, net - loans - work);
  let four = 0;
  for (let y = 0; y < 4; y++) four += Math.max(0, coa * Math.pow(1 + increase, y) - (s.renewable || y === 0 ? grants : 0));
  return { coa, grants, loans, net, cash, four, free: coa ? grants / coa : 0 };
}

export const aidComparison: ToolDef<D> = {
  initial: () => ({ schools: [blank(), blank()], increase: "3" }),
  titleOf: () => "Financial aid comparison",
  Editor: ({ data: d, set }) => (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-[#5B584F]">From each award letter, enter the yearly amounts. Grants and scholarships are free money. Loans are not.</p>
      {d.schools.map((s, i) => {
        const up = (p: Partial<School>) => set({ ...d, schools: setAt(d.schools, i, p) });
        const box = (k: "coa" | "grants" | "loans" | "work", label: string) => (
          <label className="text-[11px] text-[#5B584F]">{label}<input className={inputClass} inputMode="decimal" placeholder="$0" value={s[k]} onChange={(e) => up({ [k]: e.target.value } as Partial<School>)} /></label>
        );
        return (
          <div key={i} className="border border-[#E6E3DA] bg-white p-3 flex flex-col gap-2">
            <div className="flex gap-2"><input className={inputClass} placeholder={`College ${i + 1}`} value={s.name} onChange={(e) => up({ name: e.target.value })} /><RemoveButton onClick={() => set({ ...d, schools: removeAt(d.schools, i) })} /></div>
            <div className="grid grid-cols-2 gap-2">
              {box("coa", "Cost of attendance (per year)")}{box("grants", "Grants + scholarships")}{box("loans", "Loans offered")}{box("work", "Work-study")}
            </div>
            <label className="flex items-center gap-2 text-[12px] text-[#5B584F]"><input type="checkbox" checked={s.renewable} onChange={(e) => up({ renewable: e.target.checked })} /> Grants renew all 4 years</label>
          </div>
        );
      })}
      <AddButton onClick={() => set({ ...d, schools: [...d.schools, blank()] })}>Add a college</AddButton>
      <label className="text-[12px] text-[#5B584F] flex items-center gap-2">Yearly cost increase
        <input className="w-16 px-2 py-1 border border-[#E6E3DA] bg-[#FAF9F7] text-[13px]" value={d.increase} onChange={(e) => set({ ...d, increase: e.target.value })} />%</label>
    </div>
  ),
  Doc: ({ data: d }) => {
    const inc = n(d.increase) / 100;
    const rows = d.schools.map((s, i) => ({ s, c: calc(s, inc), label: s.name || `College ${i + 1}` }));
    const best = rows.length ? Math.min(...rows.map((r) => r.c.four)) : 0;
    return (
      <div>
        <DocTitle sub="Yearly amounts from each award letter">Financial aid comparison</DocTitle>
        <DocTable head={["", ...rows.map((r) => r.label)]} rows={[
          ["Cost of attendance", ...rows.map((r) => money(r.c.coa))],
          ["Grants + scholarships (free)", ...rows.map((r) => `${money(r.c.grants)} (${Math.round(r.c.free * 100)}%)`)],
          ["Net price (cost minus free money)", ...rows.map((r) => <b key={r.label}>{money(r.c.net)}</b>)],
          ["Loans offered", ...rows.map((r) => money(r.c.loans))],
          ["Paid from savings/income this year", ...rows.map((r) => money(r.c.cash))],
          ["Estimated 4-year net price", ...rows.map((r) => <b key={r.label} className={r.c.four === best && rows.length > 1 ? "text-[#217A78]" : ""}>{money(r.c.four)}</b>)],
        ]} />
        <p className="text-[12px] text-[#5B584F] mt-3 leading-relaxed">
          Loans are money you pay back, so compare net price, not the total &quot;aid&quot; number. The 4-year estimate assumes a {d.increase || 0}% yearly cost increase
          and grants only in year one where they don&apos;t renew. If a school&apos;s offer is lower than a comparable school&apos;s, you can ask its aid office for a review.
        </p>
      </div>
    );
  },
};
