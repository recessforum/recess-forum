"use client";

import { Area, Chips, DocTitle, Field, Text } from "./ui";
import type { ToolDef } from "./types";

/* Common IEP / 504 accommodations by area of need. Ideas to discuss with the
   team, not a prescription; the right supports depend on the evaluation. */
const IDEAS: Record<string, string[]> = {
  "Attention / ADHD": [
    "Preferential seating away from doors and windows", "Scheduled movement breaks", "Written copy of directions and assignments",
    "Large assignments broken into smaller parts", "Teacher check-ins to confirm understanding", "Extended time on tests and assignments",
    "Fidget tool or flexible seating", "Daily planner checked by a teacher", "Reduced homework volume that still shows mastery",
  ],
  "Reading / dyslexia": [
    "Audiobooks and text-to-speech", "Tests read aloud (except when reading itself is tested)", "Extended time on tests",
    "Copies of class notes or slides", "No penalty for spelling on content assignments", "Reduced copying from the board",
    "Larger print or more spacing on worksheets", "Option to show knowledge orally",
  ],
  "Writing / dysgraphia": [
    "Speech-to-text software", "Typing instead of handwriting", "Graphic organizers for planning", "Reduced written output requirements",
    "Scribe for longer responses", "Copies of notes provided", "Grading on content, not handwriting",
  ],
  "Math": [
    "Calculator when computation isn't the skill being tested", "Multiplication chart or formula sheet", "Graph paper to line up problems",
    "Worked examples to refer to", "Fewer problems that still show mastery", "Extra time for multi-step problems",
  ],
  "Anxiety": [
    "Break pass to a safe space", "Advance notice of schedule changes, drills, and substitutes", "Alternative to presenting in front of the class",
    "Regular check-in with a counselor", "Testing in a quiet, separate room", "Plan for what to do when overwhelmed",
  ],
  "Autism / sensory / social": [
    "Visual schedule", "Warnings before transitions", "Noise-reducing headphones", "Quiet space for breaks", "Sensory breaks built into the day",
    "Clear, literal instructions", "Social skills support or lunch group", "Preferred seating for sensory needs",
  ],
  "Speech / language": [
    "Extra time to process and respond", "Directions repeated or rephrased", "Visual supports alongside spoken directions",
    "Key vocabulary taught ahead of lessons", "Check for understanding before independent work",
  ],
  "Executive function / processing speed": [
    "Extended time", "Step-by-step written directions", "Assignment tracker or shared calendar with the teacher",
    "Help organizing binder and materials", "Reduced workload that still shows mastery", "Long-term projects broken into checkpoints",
  ],
  "Physical / motor": [
    "Accessible seating and classroom layout", "Elevator pass and extra passing time", "Adaptive PE", "Scribe or speech-to-text",
    "Adapted tools such as pencil grips or slant boards", "Plan for fire drills and emergencies",
  ],
  "Medical / health": [
    "Rest breaks and access to the nurse", "Water bottle and snacks in class", "Flexible attendance with a plan for make-up work",
    "Extended deadlines after absences", "Individualized health plan coordinated with the IEP or 504",
  ],
};
const AREAS = Object.keys(IDEAS);

interface D { child: string; areas: string[]; picked: string[]; notes: string }

export const accommodations: ToolDef<D> = {
  initial: () => ({ child: "", areas: [], picked: [], notes: "" }),
  titleOf: (d) => `Accommodation ideas${d.child ? ` for ${d.child}` : ""}`,
  Editor: ({ data: d, set }) => {
    const toggleArea = (a: string) => {
      const on = d.areas.includes(a);
      set({ ...d, areas: on ? d.areas.filter((x) => x !== a) : [...d.areas, a],
        // new areas start with every idea checked; removing an area drops its ideas
        picked: on ? d.picked.filter((p) => !IDEAS[a].includes(p)) : [...d.picked, ...IDEAS[a].filter((p) => !d.picked.includes(p))] });
    };
    const togglePick = (p: string) => set({ ...d, picked: d.picked.includes(p) ? d.picked.filter((x) => x !== p) : [...d.picked, p] });
    return (
      <div className="flex flex-col gap-4">
        <Field label="Child's name (optional)"><Text value={d.child} onChange={(v) => set({ ...d, child: v })} /></Field>
        <Field label="Areas where your child needs support"><Chips options={AREAS} selected={d.areas} onToggle={toggleArea} /></Field>
        {d.areas.map((a) => (
          <div key={a}>
            <p className="text-[12px] font-semibold text-[#5B584F] uppercase tracking-wide mb-1.5">{a}</p>
            <div className="flex flex-col gap-1">
              {IDEAS[a].map((p) => (
                <label key={p} className="flex items-start gap-2 text-[13px] text-[#1C1B19] cursor-pointer">
                  <input type="checkbox" className="mt-0.5" checked={d.picked.includes(p)} onChange={() => togglePick(p)} /> {p}
                </label>
              ))}
            </div>
          </div>
        ))}
        <Field label="Your notes for the meeting (optional)"><Area value={d.notes} onChange={(v) => set({ ...d, notes: v })} placeholder="What works at home, what the teacher has noticed..." /></Field>
        <p className="text-[12px] text-[#9A968A]">These are common ideas to discuss with the team. The right supports depend on your child&apos;s evaluation.</p>
      </div>
    );
  },
  Doc: ({ data: d }) => (
    <div className="text-[13px]">
      <DocTitle sub="Accommodations to discuss at the IEP or 504 meeting">Accommodation ideas{d.child ? ` for ${d.child}` : ""}</DocTitle>
      {d.areas.length === 0 && <p className="text-[#9A968A] italic">Choose an area to start your list.</p>}
      {d.areas.map((a) => {
        const items = IDEAS[a].filter((p) => d.picked.includes(p));
        return items.length ? (
          <div key={a} className="mb-4 break-inside-avoid">
            <p className="font-semibold mb-1">{a}</p>
            <ul className="list-disc pl-5 flex flex-col gap-0.5">{items.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        ) : null;
      })}
      {d.notes.trim() && <><p className="font-semibold mt-4 mb-1">Notes</p><p className="whitespace-pre-line">{d.notes}</p></>}
    </div>
  ),
};
