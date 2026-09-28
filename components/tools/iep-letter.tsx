"use client";

import { Area, Chips, Field, Letter, Text, todayLong } from "./ui";
import type { ToolDef } from "./types";

const CONCERNS = ["reading", "writing", "math", "attention and focus", "behavior", "speech or language",
  "social skills", "fine or gross motor skills", "emotional wellbeing or anxiety", "sensory needs"];

interface D { date: string; parent: string; child: string; grade: string; school: string; recipient: string;
  concerns: string[]; details: string; tried: string; outside: string }

const joinList = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export function letterText(d: D) {
  const kid = d.child.trim() || "[child's name]";
  const lines = [
    d.date, "",
    d.recipient.trim() ? `Dear ${d.recipient.trim()},` : "Dear Principal and Special Education Coordinator,", "",
    `I am the parent of ${kid}, who is in ${d.grade.trim() || "[grade]"} at ${d.school.trim() || "[school name]"}. I am writing to request a full and individual evaluation of ${kid} to determine whether ${kid} is eligible for special education and related services under the Individuals with Disabilities Education Act (IDEA).`, "",
    d.concerns.length ? `I am concerned about ${kid}'s ${joinList(d.concerns)}.${d.details.trim() ? ` ${d.details.trim()}` : ""}`
      : d.details.trim() || "[Describe what you are seeing at home and at school.]",
  ];
  if (d.tried.trim()) lines.push("", `So far we have tried: ${d.tried.trim()}`);
  if (d.outside.trim()) lines.push("", `Outside information that may help the team: ${d.outside.trim()} I am happy to share these reports.`);
  lines.push("",
    `Please evaluate ${kid} in all areas of suspected disability. I understand the school needs my written consent before evaluating, so please send me the consent form and an evaluation plan as soon as possible. I also request a copy of the evaluation reports before any eligibility meeting so I have time to review them.`, "",
    "If the school decides not to evaluate, please give me that decision in writing (Prior Written Notice), including the reasons and the information you used.", "",
    "Thank you for your help. I look forward to working with the team.", "", "Sincerely,",
    d.parent.trim() || "[Your name]", "[Phone number]", "[Email address]");
  return lines.join("\n");
}

export const iepLetter: ToolDef<D> = {
  initial: () => ({ date: todayLong(), parent: "", child: "", grade: "", school: "", recipient: "", concerns: [], details: "", tried: "", outside: "" }),
  titleOf: (d) => `IEP evaluation request${d.child ? ` for ${d.child}` : ""}`,
  Editor: ({ data: d, set }) => {
    const up = (p: Partial<D>) => set({ ...d, ...p });
    return (
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Your name"><Text value={d.parent} onChange={(v) => up({ parent: v })} /></Field>
          <Field label="Child's name"><Text value={d.child} onChange={(v) => up({ child: v })} /></Field>
          <Field label="Grade"><Text value={d.grade} placeholder="2nd grade" onChange={(v) => up({ grade: v })} /></Field>
          <Field label="School"><Text value={d.school} onChange={(v) => up({ school: v })} /></Field>
        </div>
        <Field label="Addressed to (optional)"><Text value={d.recipient} placeholder="Principal Garcia and Ms. Lee" onChange={(v) => up({ recipient: v })} /></Field>
        <Field label="Areas you're concerned about">
          <Chips options={CONCERNS} selected={d.concerns} onToggle={(c) => up({ concerns: d.concerns.includes(c) ? d.concerns.filter((x) => x !== c) : [...d.concerns, c] })} />
        </Field>
        <Field label="What you're seeing (examples help)"><Area value={d.details} onChange={(v) => up({ details: v })} placeholder="She still reverses letters and avoids reading aloud. Homework takes two hours and ends in tears." /></Field>
        <Field label="What you've already tried (optional)"><Area rows={2} value={d.tried} onChange={(v) => up({ tried: v })} placeholder="Reading tutor twice a week since March." /></Field>
        <Field label="Outside evaluations or diagnoses (optional)"><Text value={d.outside} onChange={(v) => up({ outside: v })} placeholder="Our pediatrician diagnosed ADHD in June." /></Field>
        <p className="text-[12px] text-[#9A968A]">Tip: send it by email so you have a dated record. Timelines vary by state. General information, not legal advice.</p>
      </div>
    );
  },
  Doc: ({ data }) => <Letter text={letterText(data)} />,
};
