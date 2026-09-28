"use client";

import { AddButton, DocTable, DocTitle, Field, RemoveButton, Text, fmtDate, inputClass, removeAt, setAt } from "./ui";
import type { ToolDef } from "./types";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
interface Entry { date: string; quarter: string; subject: string; hours: string; notes: string }
interface D { student: string; schoolYear: string; required: string; entries: Entry[] }
const newEntry = (q = "Q1"): Entry => ({ date: "", quarter: q, subject: "", hours: "", notes: "" });
const h = (s: string) => Math.max(0, parseFloat(s) || 0);
const fmt = (x: number) => (Math.round(x * 10) / 10).toString();

export const homeschoolHoursLog: ToolDef<D> = {
  initial: () => ({ student: "", schoolYear: "", required: "", entries: [newEntry(), newEntry(), newEntry()] }),
  titleOf: (d) => `Homeschool hours${d.student ? ` for ${d.student}` : ""}${d.schoolYear ? `, ${d.schoolYear}` : ""}`,
  Editor: ({ data: d, set }) => (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Student"><Text value={d.student} onChange={(v) => set({ ...d, student: v })} /></Field>
        <Field label="School year"><Text value={d.schoolYear} placeholder="2026-27" onChange={(v) => set({ ...d, schoolYear: v })} /></Field>
        <Field label="Required hours / year" hint="e.g. NY: 900 (gr 1-6), 990 (7-12)"><Text value={d.required} onChange={(v) => set({ ...d, required: v })} /></Field>
      </div>
      {d.entries.map((e, i) => (
        <div key={i} className="grid grid-cols-[130px_64px_1fr_64px_auto] gap-1.5">
          <input type="date" className={inputClass} value={e.date} onChange={(ev) => set({ ...d, entries: setAt(d.entries, i, { date: ev.target.value }) })} />
          <select className={inputClass} value={e.quarter} onChange={(ev) => set({ ...d, entries: setAt(d.entries, i, { quarter: ev.target.value }) })}>{QUARTERS.map((q) => <option key={q}>{q}</option>)}</select>
          <input className={inputClass} placeholder="Subject" value={e.subject} onChange={(ev) => set({ ...d, entries: setAt(d.entries, i, { subject: ev.target.value }) })} />
          <input className={inputClass} inputMode="decimal" placeholder="Hrs" value={e.hours} onChange={(ev) => set({ ...d, entries: setAt(d.entries, i, { hours: ev.target.value }) })} />
          <RemoveButton onClick={() => set({ ...d, entries: removeAt(d.entries, i) })} />
        </div>
      ))}
      <AddButton onClick={() => set({ ...d, entries: [...d.entries, newEntry(d.entries.at(-1)?.quarter)] })}>Add an entry</AddButton>
    </div>
  ),
  Doc: ({ data: d }) => {
    const rows = d.entries.filter((e) => e.subject && h(e.hours) > 0);
    const subjects = [...new Set(rows.map((e) => e.subject.trim()))].sort();
    const by = (s: string, q: string) => rows.filter((e) => e.subject.trim() === s && e.quarter === q).reduce((a, e) => a + h(e.hours), 0);
    const total = rows.reduce((a, e) => a + h(e.hours), 0);
    const req = h(d.required);
    return (
      <div className="text-[13px]">
        <DocTitle sub={[d.student, d.schoolYear].filter(Boolean).join(" · ") || undefined}>Homeschool instruction hours</DocTitle>
        <p className="mb-3"><b>Total: {fmt(total)} hours</b>{req ? ` of ${fmt(req)} required (${Math.round((total / req) * 100)}%)` : ""}</p>
        <DocTable head={["Subject", ...QUARTERS, "Total"]}
          rows={subjects.map((s) => [s, ...QUARTERS.map((q) => fmt(by(s, q))), <b key={s}>{fmt(QUARTERS.reduce((a, q) => a + by(s, q), 0))}</b>])}
          foot={["All subjects", ...QUARTERS.map((q) => fmt(rows.filter((e) => e.quarter === q).reduce((a, e) => a + h(e.hours), 0))), fmt(total)]} />
        {rows.some((e) => e.date) && (
          <>
            <p className="font-semibold mt-6 mb-1">Log</p>
            <DocTable head={["Date", "Quarter", "Subject", "Hours"]} rows={[...rows].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [fmtDate(e.date), e.quarter, e.subject, e.hours])} />
          </>
        )}
      </div>
    );
  },
};
