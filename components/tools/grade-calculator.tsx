"use client";

import { DocTable, DocTitle, Field, Select, Text, fmtDate } from "./ui";
import type { ToolDef } from "./types";

interface D { child: string; birthday: string; cutoffMonth: string; cutoffDay: string }
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const gradeName = (g: number) => (g < 0 ? "Pre-K / TK" : g === 0 ? "Kindergarten" : `${g}${g === 1 ? "st" : g === 2 ? "nd" : g === 3 ? "rd" : "th"} grade`);

/** First school year (by starting calendar year) the child can start kindergarten: age 5 on or before the cutoff. */
export function kindergartenYear(birthday: string, month: number, day: number) {
  const b = new Date(`${birthday}T12:00:00`);
  const fifth = new Date(b.getFullYear() + 5, b.getMonth(), b.getDate());
  const cutoffThatYear = new Date(fifth.getFullYear(), month, day);
  return fifth <= cutoffThatYear ? fifth.getFullYear() : fifth.getFullYear() + 1;
}

export const gradeCalculator: ToolDef<D> = {
  initial: () => ({ child: "", birthday: "", cutoffMonth: "8", cutoffDay: "1" }),
  titleOf: (d) => `Grade by year${d.child ? ` for ${d.child}` : ""}`,
  Editor: ({ data: d, set }) => (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Child's name (optional)"><Text value={d.child} onChange={(v) => set({ ...d, child: v })} /></Field>
        <Field label="Birthday"><Text type="date" value={d.birthday} onChange={(v) => set({ ...d, birthday: v })} /></Field>
        <Field label="Kindergarten cutoff month"><Select value={d.cutoffMonth} onChange={(v) => set({ ...d, cutoffMonth: v })} options={MONTHS.map((m, i) => ({ value: String(i), label: m }))} /></Field>
        <Field label="Cutoff day"><Text value={d.cutoffDay} onChange={(v) => set({ ...d, cutoffDay: v })} /></Field>
      </div>
      <p className="text-[12px] text-[#9A968A] leading-relaxed">
        The cutoff is the date a child must turn 5 by to start kindergarten that fall. September 1 is the most common, but it varies by state and
        sometimes by district. Check with your district, and note that private schools may use their own dates.
      </p>
    </div>
  ),
  Doc: ({ data: d }) => {
    if (!d.birthday) return <p className="text-[14px] text-[#9A968A] italic">Enter a birthday to see grades by school year.</p>;
    const k = kindergartenYear(d.birthday, +d.cutoffMonth, parseInt(d.cutoffDay) || 1);
    const now = new Date();
    const current = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    const years = Array.from({ length: 16 }, (_, i) => k - 1 + i).filter((y) => y >= current - 1);
    return (
      <div className="text-[13px]">
        <DocTitle sub={`Born ${fmtDate(d.birthday)} · cutoff ${MONTHS[+d.cutoffMonth]} ${parseInt(d.cutoffDay) || 1}`}>{d.child ? `${d.child}'s grade by school year` : "Grade by school year"}</DocTitle>
        <p className="mb-3">Starts kindergarten in <b>fall {k}</b> · High school class of <b>{k + 13}</b></p>
        <DocTable head={["School year", "Grade"]} rows={years.map((y) => [`${y}-${String(y + 1).slice(2)}${y === current ? " (this year)" : ""}`, gradeName(y - k)])} />
      </div>
    );
  },
};
