"use client";

import { Area, DocTable, DocTitle, Field, Select, Text, fmtDate } from "./ui";
import type { ToolDef } from "./types";

/* Subjects required for home instruction in New York, by grade band
   (Commissioner's Regulation 8 NYCRR 100.10). Families should confirm details
   with their district; the regulation also sets unit requirements. */
type Band = "1-6" | "7-8" | "9-12";
const SUBJECTS: Record<Band, string[]> = {
  "1-6": ["Arithmetic", "Reading", "Spelling", "Writing", "English language", "Geography", "United States history", "Science",
    "Health education", "Music", "Visual arts", "Physical education"],
  "7-8": ["English", "History and geography", "Science", "Mathematics", "Physical education", "Health education", "Art", "Music",
    "Practical arts", "Library skills"],
  "9-12": ["English", "Social studies (including American history, participation in government, and economics)", "Mathematics", "Science",
    "Art and/or music", "Health education", "Physical education", "Electives"],
};
const ALSO = "Also required at some point in grades 1-12: patriotism and citizenship, substance abuse prevention, traffic safety, and fire and arson prevention. United States and New York history and constitutions must be covered at least once in grades 1-8.";
const bandOf = (grade: string): Band => { const g = parseInt(grade); return g >= 9 ? "9-12" : g >= 7 ? "7-8" : "1-6"; };
const GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const gradeLabel = (g: string) => `Grade ${g}`;

interface IHIP { child: string; age: string; grade: string; schoolYear: string; instructor: string; reports: string[]; plans: Record<string, string> }

export const nyIhip: ToolDef<IHIP> = {
  initial: () => ({ child: "", age: "", grade: "3", schoolYear: "", instructor: "", reports: ["", "", "", ""], plans: {} }),
  titleOf: (d) => `NY IHIP${d.child ? ` for ${d.child}` : ""}${d.schoolYear ? `, ${d.schoolYear}` : ""}`,
  Editor: ({ data: d, set }) => (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Child's name"><Text value={d.child} onChange={(v) => set({ ...d, child: v })} /></Field>
        <Field label="Age"><Text value={d.age} onChange={(v) => set({ ...d, age: v })} /></Field>
        <Field label="Grade level"><Select value={d.grade} onChange={(v) => set({ ...d, grade: v })} options={GRADES.map((g) => ({ value: g, label: gradeLabel(g) }))} /></Field>
        <Field label="School year"><Text value={d.schoolYear} placeholder="2026-27" onChange={(v) => set({ ...d, schoolYear: v })} /></Field>
      </div>
      <Field label="Name(s) of the person providing instruction"><Text value={d.instructor} onChange={(v) => set({ ...d, instructor: v })} /></Field>
      <Field label="Quarterly report dates">
        <div className="grid grid-cols-4 gap-1.5">
          {d.reports.map((r, i) => <input key={i} type="date" className="px-2 py-2 border border-[#E6E3DA] bg-[#FAF9F7] text-[13px]" value={r}
            onChange={(e) => set({ ...d, reports: d.reports.map((x, j) => (j === i ? e.target.value : x)) })} />)}
        </div>
      </Field>
      <p className="text-[12px] font-semibold text-[#5B584F] uppercase tracking-wide mt-1">Curriculum materials or plan for each required subject</p>
      {SUBJECTS[bandOf(d.grade)].map((s) => (
        <Field key={s} label={s}><Area rows={2} value={d.plans[s] ?? ""} onChange={(v) => set({ ...d, plans: { ...d.plans, [s]: v } })} placeholder="Textbook, curriculum, or plan of instruction" /></Field>
      ))}
      <p className="text-[12px] text-[#9A968A] leading-relaxed">{ALSO} Based on 8 NYCRR 100.10. Confirm your district&apos;s process and deadlines.</p>
    </div>
  ),
  Doc: ({ data: d }) => (
    <div className="text-[13px]">
      <DocTitle sub="Pursuant to Section 100.10 of the Regulations of the Commissioner of Education">Individualized Home Instruction Plan (IHIP)</DocTitle>
      <div className="grid grid-cols-2 gap-y-1 mb-4">
        <p><b>Child:</b> {d.child || "[Name]"}</p><p><b>Age:</b> {d.age || "[Age]"}</p>
        <p><b>Grade level:</b> {d.grade}</p><p><b>School year:</b> {d.schoolYear || "[Year]"}</p>
        <p className="col-span-2"><b>Instruction provided by:</b> {d.instructor || "[Name]"}</p>
        <p className="col-span-2"><b>Quarterly reports will be submitted on:</b> {d.reports.map((r) => (r ? fmtDate(r) : "[date]")).join(", ")}</p>
      </div>
      <DocTable head={["Subject", "Syllabi, curriculum materials, textbooks, or plan of instruction"]} rows={SUBJECTS[bandOf(d.grade)].map((s) => [s, d.plans[s] || ""])} />
      <p className="mt-3 text-[12px]">{ALSO}</p>
      <div className="grid grid-cols-2 gap-10 mt-10"><p className="border-t border-[#1C1B19] pt-1">Parent signature</p><p className="border-t border-[#1C1B19] pt-1">Date</p></div>
    </div>
  ),
};

interface QR { child: string; grade: string; schoolYear: string; quarter: string; hours: string; covered: Record<string, string>; evals: Record<string, string>; under80: string }

export const nyQuarterlyReport: ToolDef<QR> = {
  initial: () => ({ child: "", grade: "3", schoolYear: "", quarter: "1", hours: "", covered: {}, evals: {}, under80: "" }),
  titleOf: (d) => `NY quarterly report Q${d.quarter}${d.child ? ` for ${d.child}` : ""}`,
  Editor: ({ data: d, set }) => (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Child's name"><Text value={d.child} onChange={(v) => set({ ...d, child: v })} /></Field>
        <Field label="Grade level"><Select value={d.grade} onChange={(v) => set({ ...d, grade: v })} options={GRADES.map((g) => ({ value: g, label: gradeLabel(g) }))} /></Field>
        <Field label="School year"><Text value={d.schoolYear} placeholder="2026-27" onChange={(v) => set({ ...d, schoolYear: v })} /></Field>
        <Field label="Quarter"><Select value={d.quarter} onChange={(v) => set({ ...d, quarter: v })} options={["1", "2", "3", "4"].map((q) => ({ value: q, label: `Quarter ${q}` }))} /></Field>
      </div>
      <Field label="Hours of instruction this quarter" hint="NY requires the equivalent of 900 hours a year for grades 1-6 and 990 for grades 7-12.">
        <Text value={d.hours} onChange={(v) => set({ ...d, hours: v })} /></Field>
      {SUBJECTS[bandOf(d.grade)].map((s) => (
        <div key={s} className="grid grid-cols-[1fr_140px] gap-2">
          <Field label={s}><Area rows={2} value={d.covered[s] ?? ""} onChange={(v) => set({ ...d, covered: { ...d.covered, [s]: v } })} placeholder="Material covered" /></Field>
          <Field label="Grade or evaluation"><Text value={d.evals[s] ?? ""} onChange={(v) => set({ ...d, evals: { ...d.evals, [s]: v } })} placeholder="A / Satisfactory" /></Field>
        </div>
      ))}
      <Field label="If less than 80% of the planned material was covered, explain (optional)"><Area value={d.under80} onChange={(v) => set({ ...d, under80: v })} /></Field>
    </div>
  ),
  Doc: ({ data: d }) => (
    <div className="text-[13px]">
      <DocTitle sub="Home instruction quarterly report (8 NYCRR 100.10)">Quarterly Report: Quarter {d.quarter}</DocTitle>
      <div className="grid grid-cols-2 gap-y-1 mb-4">
        <p><b>Child:</b> {d.child || "[Name]"}</p><p><b>Grade level:</b> {d.grade}</p>
        <p><b>School year:</b> {d.schoolYear || "[Year]"}</p><p><b>Hours of instruction this quarter:</b> {d.hours || "[Hours]"}</p>
      </div>
      <DocTable head={["Subject", "Material covered", "Grade / evaluation"]} rows={SUBJECTS[bandOf(d.grade)].map((s) => [s, d.covered[s] ?? "", d.evals[s] ?? ""])} />
      {d.under80.trim() && <><p className="font-semibold mt-4">Explanation</p><p className="whitespace-pre-line">{d.under80}</p></>}
      <div className="grid grid-cols-2 gap-10 mt-10"><p className="border-t border-[#1C1B19] pt-1">Parent signature</p><p className="border-t border-[#1C1B19] pt-1">Date</p></div>
    </div>
  ),
};
