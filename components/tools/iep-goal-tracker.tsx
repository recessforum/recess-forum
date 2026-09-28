"use client";

import { AddButton, DocTable, DocTitle, Field, RemoveButton, Text, fmtDate, inputClass, removeAt, setAt } from "./ui";
import type { ToolDef } from "./types";

interface Entry { date: string; note: string }
interface Goal { area: string; goal: string; entries: Entry[] }
interface D { child: string; iepDate: string; goals: Goal[] }
const newGoal = (): Goal => ({ area: "", goal: "", entries: [{ date: "", note: "" }] });

export const iepGoalTracker: ToolDef<D> = {
  initial: () => ({ child: "", iepDate: "", goals: [newGoal()] }),
  titleOf: (d) => `IEP goal progress${d.child ? ` for ${d.child}` : ""}`,
  Editor: ({ data: d, set }) => (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Child's name"><Text value={d.child} onChange={(v) => set({ ...d, child: v })} /></Field>
        <Field label="IEP date"><Text type="date" value={d.iepDate} onChange={(v) => set({ ...d, iepDate: v })} /></Field>
      </div>
      {d.goals.map((g, i) => {
        const upG = (p: Partial<Goal>) => set({ ...d, goals: setAt(d.goals, i, p) });
        return (
          <div key={i} className="border border-[#E6E3DA] bg-white p-3 flex flex-col gap-2">
            <div className="flex gap-2"><input className={inputClass} placeholder="Area (e.g. Reading fluency)" value={g.area} onChange={(e) => upG({ area: e.target.value })} /><RemoveButton onClick={() => set({ ...d, goals: removeAt(d.goals, i) })} /></div>
            <textarea className={inputClass} rows={2} placeholder="Goal as written in the IEP" value={g.goal} onChange={(e) => upG({ goal: e.target.value })} />
            {g.entries.map((en, j) => (
              <div key={j} className="grid grid-cols-[140px_1fr_auto] gap-1.5">
                <input type="date" className={inputClass} value={en.date} onChange={(e) => upG({ entries: setAt(g.entries, j, { date: e.target.value }) })} />
                <input className={inputClass} placeholder="What you saw (e.g. read 62 wpm, 3 errors)" value={en.note} onChange={(e) => upG({ entries: setAt(g.entries, j, { note: e.target.value }) })} />
                <RemoveButton onClick={() => upG({ entries: removeAt(g.entries, j) })} />
              </div>
            ))}
            <AddButton onClick={() => upG({ entries: [...g.entries, { date: "", note: "" }] })}>Add a progress note</AddButton>
          </div>
        );
      })}
      <AddButton onClick={() => set({ ...d, goals: [...d.goals, newGoal()] })}>Add a goal</AddButton>
    </div>
  ),
  Doc: ({ data: d }) => (
    <div className="text-[13px]">
      <DocTitle sub={d.iepDate ? `IEP dated ${fmtDate(d.iepDate)}` : undefined}>IEP goal progress{d.child ? `: ${d.child}` : ""}</DocTitle>
      {d.goals.filter((g) => g.area || g.goal).map((g, i) => (
        <div key={i} className="mb-5 break-inside-avoid">
          <p className="font-semibold">{g.area || `Goal ${i + 1}`}</p>
          {g.goal && <p className="mb-2 text-[#5B584F]">{g.goal}</p>}
          <DocTable head={["Date", "Progress observed at home"]} rows={g.entries.filter((e) => e.date || e.note).sort((a, b) => a.date.localeCompare(b.date)).map((e) => [fmtDate(e.date), e.note])} />
        </div>
      ))}
    </div>
  ),
};
