"use client";

import { fmtGpa, gpa, newCourse, type Course } from "./gpa-lib";
import { CourseRows } from "./course-rows";
import { AddButton, DocTable, DocTitle, Field, Text } from "./ui";
import type { ToolDef } from "./types";

interface D { student: string; term: string; courses: Course[] }

export const gpaCalculator: ToolDef<D> = {
  initial: () => ({ student: "", term: "", courses: [newCourse(), newCourse(), newCourse(), newCourse()] }),
  titleOf: (d) => `GPA${d.student ? ` for ${d.student}` : ""}${d.term ? `, ${d.term}` : ""}`,
  Editor: ({ data: d, set }) => (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Student (optional)"><Text value={d.student} onChange={(v) => set({ ...d, student: v })} /></Field>
        <Field label="Term (optional)"><Text value={d.term} placeholder="Fall 2026" onChange={(v) => set({ ...d, term: v })} /></Field>
      </div>
      <CourseRows courses={d.courses} onChange={(c) => set({ ...d, courses: c })} />
      <AddButton onClick={() => set({ ...d, courses: [...d.courses, newCourse()] })}>Add a class</AddButton>
    </div>
  ),
  Doc: ({ data: d }) => {
    const g = gpa(d.courses);
    return (
      <div>
        <DocTitle sub={[d.student, d.term].filter(Boolean).join(" · ") || undefined}>GPA summary</DocTitle>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[["Unweighted", fmtGpa(g.unweighted)], ["Weighted", fmtGpa(g.weighted)], ["Credits", String(g.credits)]].map(([k, v]) => (
            <div key={k} className="border border-[#E6E3DA] p-3"><p className="text-[22px] font-semibold text-[#1C1B19]">{v}</p><p className="text-[12px] text-[#9A968A]">{k}</p></div>
          ))}
        </div>
        <DocTable head={["Course", "Level", "Grade", "Credits"]} rows={d.courses.filter((c) => c.name || parseFloat(c.credits) > 0).map((c) => [c.name || "Untitled", c.level, c.grade, c.credits])} />
      </div>
    );
  },
};
