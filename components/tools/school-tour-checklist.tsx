"use client";

import { Area, DocTitle, Field, Select, Text, fmtDate } from "./ui";
import type { ToolDef } from "./types";

type Kind = "public" | "private" | "charter" | "preschool";
const COMMON = [
  "What does a typical day look like for a student in this grade?", "How big are classes, and how many adults are in the room?",
  "How do you support kids who are behind, and kids who are ahead?", "How do you handle bullying? Can you give a recent example?",
  "How do teachers communicate with parents, and how often?", "What is teacher turnover like?",
  "How much homework should we expect?", "How do you support students with IEPs or 504 plans?",
];
const BY_KIND: Record<Kind, string[]> = {
  public: ["Which programs (gifted, dual language, special ed) are at this school vs elsewhere in the district?", "How are students placed in classes?", "What before and after care is available?"],
  private: ["What is the total yearly cost, including fees, and is financial aid available?", "What happens if my child needs special education services?", "How do graduates do at the next school level?"],
  charter: ["How does the lottery and waitlist work?", "What is the school's charter focus, and when is it up for renewal?", "Is transportation provided?", "How are special education services delivered?"],
  preschool: ["What is the ratio of teachers to children?", "How do you handle potty training, naps, and separation?", "Is the program play-based or academic?", "Are staff trained in first aid and CPR?"],
};

interface D { kind: Kind; school: string; date: string; answers: Record<string, string>; notes: string }
const questions = (k: Kind) => [...COMMON, ...BY_KIND[k]];

export const schoolTourChecklist: ToolDef<D> = {
  initial: () => ({ kind: "public", school: "", date: "", answers: {}, notes: "" }),
  titleOf: (d) => `School tour${d.school ? `: ${d.school}` : ""}`,
  Editor: ({ data: d, set }) => (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-3 gap-3">
        <Field label="School type"><Select value={d.kind} onChange={(v) => set({ ...d, kind: v })} options={[{ value: "public", label: "Public" }, { value: "private", label: "Private" }, { value: "charter", label: "Charter" }, { value: "preschool", label: "Preschool" }]} /></Field>
        <Field label="School"><Text value={d.school} onChange={(v) => set({ ...d, school: v })} /></Field>
        <Field label="Tour date"><Text type="date" value={d.date} onChange={(v) => set({ ...d, date: v })} /></Field>
      </div>
      {questions(d.kind).map((q) => (
        <Field key={q} label={q}><Area rows={2} value={d.answers[q] ?? ""} onChange={(v) => set({ ...d, answers: { ...d.answers, [q]: v } })} placeholder="Notes" /></Field>
      ))}
      <Field label="Overall impressions"><Area value={d.notes} onChange={(v) => set({ ...d, notes: v })} /></Field>
    </div>
  ),
  Doc: ({ data: d }) => (
    <div className="text-[13px]">
      <DocTitle sub={[d.kind[0].toUpperCase() + d.kind.slice(1) + " school", d.date && fmtDate(d.date)].filter(Boolean).join(" · ")}>School tour{d.school ? `: ${d.school}` : ""}</DocTitle>
      <ol className="list-decimal pl-5 flex flex-col gap-3">
        {questions(d.kind).map((q) => (
          <li key={q} className="break-inside-avoid"><p className="font-semibold">{q}</p>
            <p className="whitespace-pre-line min-h-[2.2em] border-b border-dotted border-[#C9C4B6]">{d.answers[q] ?? ""}</p></li>
        ))}
      </ol>
      {d.notes.trim() && <><p className="font-semibold mt-4">Overall impressions</p><p className="whitespace-pre-line">{d.notes}</p></>}
    </div>
  ),
};
