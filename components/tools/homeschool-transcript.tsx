"use client";

import { fmtGpa, gpa, newCourse, type Course } from "./gpa-lib";
import { CourseRows } from "./course-rows";
import { AddButton, DocTable, Field, RemoveButton, Text, removeAt, setAt } from "./ui";
import type { ToolDef } from "./types";

interface Year { label: string; schoolYear: string; courses: Course[] }
interface D { student: string; dob: string; school: string; address: string; administrator: string; graduation: string; years: Year[] }

const yearOf = (label: string): Year => ({ label, schoolYear: "", courses: [newCourse(), newCourse()] });

export const homeschoolTranscript: ToolDef<D> = {
  initial: () => ({ student: "", dob: "", school: "", address: "", administrator: "", graduation: "",
    years: [yearOf("9th grade"), yearOf("10th grade"), yearOf("11th grade"), yearOf("12th grade")] }),
  titleOf: (d) => `Transcript${d.student ? ` for ${d.student}` : ""}`,
  Editor: ({ data: d, set }) => (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Student name"><Text value={d.student} onChange={(v) => set({ ...d, student: v })} /></Field>
        <Field label="Date of birth"><Text type="date" value={d.dob} onChange={(v) => set({ ...d, dob: v })} /></Field>
        <Field label="Homeschool name"><Text value={d.school} placeholder="Maple Street Academy" onChange={(v) => set({ ...d, school: v })} /></Field>
        <Field label="Expected graduation"><Text value={d.graduation} placeholder="June 2028" onChange={(v) => set({ ...d, graduation: v })} /></Field>
        <Field label="Address"><Text value={d.address} onChange={(v) => set({ ...d, address: v })} /></Field>
        <Field label="Administrator (parent)"><Text value={d.administrator} onChange={(v) => set({ ...d, administrator: v })} /></Field>
      </div>
      {d.years.map((y, i) => (
        <div key={i} className="border border-[#E6E3DA] bg-white p-3">
          <div className="flex items-center gap-2 mb-2">
            <input className="text-[14px] font-semibold bg-transparent outline-none flex-1" value={y.label} onChange={(e) => set({ ...d, years: setAt(d.years, i, { label: e.target.value }) })} />
            <input className="text-[13px] bg-[#FAF9F7] border border-[#E6E3DA] px-2 py-1 w-32" placeholder="2026-27" value={y.schoolYear} onChange={(e) => set({ ...d, years: setAt(d.years, i, { schoolYear: e.target.value }) })} />
            <RemoveButton onClick={() => set({ ...d, years: removeAt(d.years, i) })} />
          </div>
          <CourseRows courses={y.courses} onChange={(c) => set({ ...d, years: setAt(d.years, i, { courses: c }) })} />
          <div className="mt-2"><AddButton onClick={() => set({ ...d, years: setAt(d.years, i, { courses: [...y.courses, newCourse()] }) })}>Add a course</AddButton></div>
        </div>
      ))}
      <AddButton onClick={() => set({ ...d, years: [...d.years, yearOf("Additional year")] })}>Add a year</AddButton>
    </div>
  ),
  Doc: ({ data: d }) => {
    const all = d.years.flatMap((y) => y.courses);
    const total = gpa(all);
    return (
      <div className="text-[13px]">
        <h2 className="text-[20px] font-semibold text-center tracking-wide mb-1">OFFICIAL HIGH SCHOOL TRANSCRIPT</h2>
        <p className="text-center text-[14px] mb-4">{d.school || "[Homeschool name]"}{d.address ? ` · ${d.address}` : ""}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-5">
          <p><b>Student:</b> {d.student || "[Name]"}</p>
          <p><b>Date of birth:</b> {d.dob || "[Date]"}</p>
          <p><b>Expected graduation:</b> {d.graduation || "[Date]"}</p>
          <p><b>Administrator:</b> {d.administrator || "[Parent name]"}</p>
        </div>
        {d.years.map((y, i) => {
          const g = gpa(y.courses);
          const rows = y.courses.filter((c) => c.name).map((c) => [c.name, c.level === "Regular" ? "" : c.level, c.grade, c.credits]);
          if (!rows.length) return null;
          return (
            <div key={i} className="mb-4 break-inside-avoid">
              <p className="font-semibold mb-1">{y.label}{y.schoolYear ? ` (${y.schoolYear})` : ""}</p>
              <DocTable head={["Course", "Level", "Grade", "Credits"]} rows={rows} foot={["Year GPA", `${fmtGpa(g.unweighted)} unweighted / ${fmtGpa(g.weighted)} weighted`, "", String(g.credits)]} />
            </div>
          );
        })}
        <div className="border-t-2 border-[#1C1B19] pt-3 mt-4 grid grid-cols-3 gap-3">
          <p><b>Total credits:</b> {total.credits}</p>
          <p><b>Cumulative GPA (unweighted):</b> {fmtGpa(total.unweighted)}</p>
          <p><b>Cumulative GPA (weighted):</b> {fmtGpa(total.weighted)}</p>
        </div>
        <p className="mt-3 text-[12px] text-[#5B584F]">Grading scale: A = 4.0, B = 3.0, C = 2.0, D = 1.0, F = 0. Weighted GPA adds 0.5 for honors and 1.0 for AP, IB, or dual enrollment courses.</p>
        <p className="mt-10">I certify that this transcript is an accurate record of the student&apos;s high school coursework.</p>
        <div className="grid grid-cols-2 gap-10 mt-10">
          <p className="border-t border-[#1C1B19] pt-1">Signature of administrator</p>
          <p className="border-t border-[#1C1B19] pt-1">Date</p>
        </div>
      </div>
    );
  },
};
