"use client";

import { US_STATES } from "@/lib/location";
import { Field, Letter, Select, Text, fmtDate, todayLong } from "./ui";
import type { ToolDef } from "./types";

interface D { date: string; parent: string; address: string; child: string; grade: string; school: string; recipient: string; state: string; effective: string; records: boolean }

const stateName = (code: string) => US_STATES.find((s) => s.code === code)?.name ?? "";

function text(d: D) {
  const kid = d.child.trim() || "[child's name]";
  const st = stateName(d.state);
  return [
    d.date, d.parent.trim() || "[Your name]", d.address.trim() || "[Your address]", "",
    d.recipient.trim() ? `Dear ${d.recipient.trim()},` : "Dear Principal,", "",
    `Please accept this letter as notice that, effective ${d.effective ? fmtDate(d.effective) : "[date]"}, we are withdrawing our child, ${kid}${d.grade.trim() ? ` (${d.grade.trim()})` : ""}, from ${d.school.trim() || "[school name]"} to provide home instruction${st ? ` in accordance with ${st} law` : ""}.`, "",
    `Please remove ${kid} from the school's attendance roster as of that date so there is no question of absence or truancy.`,
    ...(d.records ? ["", `We also request a copy of ${kid}'s cumulative school records, including report cards, test results, and any special education records such as an IEP, 504 plan, or evaluations.`] : []),
    "", "Thank you for the care you've given our child. Please contact me with any questions.", "", "Sincerely,",
    d.parent.trim() || "[Your name]", "[Phone number]", "[Email address]",
  ].join("\n");
}

export const homeschoolWithdrawalLetter: ToolDef<D> = {
  initial: () => ({ date: todayLong(), parent: "", address: "", child: "", grade: "", school: "", recipient: "", state: "CA", effective: "", records: true }),
  titleOf: (d) => `Homeschool withdrawal letter${d.child ? ` for ${d.child}` : ""}`,
  Editor: ({ data: d, set }) => {
    const up = (p: Partial<D>) => set({ ...d, ...p });
    return (
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Your name"><Text value={d.parent} onChange={(v) => up({ parent: v })} /></Field>
          <Field label="Your address"><Text value={d.address} onChange={(v) => up({ address: v })} /></Field>
          <Field label="Child's name"><Text value={d.child} onChange={(v) => up({ child: v })} /></Field>
          <Field label="Grade"><Text value={d.grade} placeholder="4th grade" onChange={(v) => up({ grade: v })} /></Field>
          <Field label="School"><Text value={d.school} onChange={(v) => up({ school: v })} /></Field>
          <Field label="Addressed to (optional)"><Text value={d.recipient} placeholder="Principal Smith" onChange={(v) => up({ recipient: v })} /></Field>
          <Field label="State"><Select value={d.state} onChange={(v) => up({ state: v })} options={US_STATES.map((s) => ({ value: s.code, label: s.name }))} /></Field>
          <Field label="Effective date"><Text type="date" value={d.effective} onChange={(v) => up({ effective: v })} /></Field>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-[#5B584F]"><input type="checkbox" checked={d.records} onChange={(e) => up({ records: e.target.checked })} /> Request a copy of school records</label>
        <p className="text-[12px] text-[#9A968A] leading-relaxed">
          Important: in many states this letter is not your legal homeschool filing. Some states require a notice of intent to the district,
          an affidavit, or enrolling in an umbrella school. Check your state&apos;s rules (HSLDA has a state-by-state map) and file that too.
        </p>
      </div>
    );
  },
  Doc: ({ data }) => <Letter text={text(data)} />,
};
