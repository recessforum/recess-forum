"use client";

import { GRADES, LEVELS, type Course, type Grade, type Level } from "./gpa-lib";
import { RemoveButton, inputClass, removeAt, setAt } from "./ui";

/** Editable list of courses (name, grade, credits, level). */
export function CourseRows({ courses, onChange }: { courses: Course[]; onChange: (c: Course[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {courses.map((c, i) => (
        <div key={i} className="grid grid-cols-[1fr_70px_64px_auto] sm:grid-cols-[1fr_76px_70px_150px_auto] gap-1.5 items-center">
          <input className={`${inputClass} col-span-4 sm:col-span-1`} placeholder="Course" value={c.name} onChange={(e) => onChange(setAt(courses, i, { name: e.target.value }))} />
          <select className={inputClass} value={c.grade} onChange={(e) => onChange(setAt(courses, i, { grade: e.target.value as Grade }))}>
            {GRADES.map((g) => <option key={g}>{g}</option>)}
          </select>
          <input className={inputClass} inputMode="decimal" title="Credits" value={c.credits} onChange={(e) => onChange(setAt(courses, i, { credits: e.target.value }))} />
          <select className={`${inputClass} hidden sm:block`} value={c.level} onChange={(e) => onChange(setAt(courses, i, { level: e.target.value as Level }))}>
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
          <RemoveButton onClick={() => onChange(removeAt(courses, i))} />
        </div>
      ))}
      <p className="text-[11px] text-[#9A968A]">Grade · credits (1 = full year, 0.5 = semester) · level. Honors adds 0.5 and AP/IB/dual enrollment adds 1.0 to the weighted GPA. Schools vary.</p>
    </div>
  );
}
