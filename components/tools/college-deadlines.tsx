"use client";

import { CalendarPlus } from "lucide-react";
import { AddButton, DocTable, DocTitle, RemoveButton, fmtDate, inputClass, removeAt, setAt } from "./ui";
import type { ToolDef } from "./types";

interface Item { what: string; date: string; notes: string }
interface D { student: string; items: Item[] }
const starter = (): Item[] => [
  { what: "FAFSA opens", date: "", notes: "" }, { what: "College 1: Early Decision deadline", date: "", notes: "" },
  { what: "College 2: Early Action deadline", date: "", notes: "" }, { what: "CSS Profile due (if required)", date: "", notes: "" },
];

/** Builds an .ics file of all-day events that Google, Apple, and Outlook calendars can import. */
function ics(d: D) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const events = d.items.filter((i) => i.what && i.date).map((i, k) => {
    const day = i.date.replace(/-/g, "");
    const next = new Date(`${i.date}T12:00:00`); next.setDate(next.getDate() + 1);
    const end = next.toISOString().slice(0, 10).replace(/-/g, "");
    return ["BEGIN:VEVENT", `UID:${day}-${k}@recessforum.com`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${esc(i.what)}`, ...(i.notes ? [`DESCRIPTION:${esc(i.notes)}`] : []),
      "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", `DESCRIPTION:${esc(i.what)} in 1 week`, "END:VALARM", "END:VEVENT"].join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Recess Forum//College deadlines//EN", ...events, "END:VCALENDAR"].join("\r\n");
}

export const collegeDeadlines: ToolDef<D> = {
  initial: () => ({ student: "", items: starter() }),
  titleOf: (d) => `College deadlines${d.student ? ` for ${d.student}` : ""}`,
  Editor: ({ data: d, set }) => {
    const download = () => {
      const url = URL.createObjectURL(new Blob([ics(d)], { type: "text/calendar" }));
      const a = document.createElement("a"); a.href = url; a.download = "college-deadlines.ics"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    return (
      <div className="flex flex-col gap-2.5">
        <input className={inputClass} placeholder="Student (optional)" value={d.student} onChange={(e) => set({ ...d, student: e.target.value })} />
        {d.items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_140px_auto] gap-1.5">
            <input className={inputClass} placeholder="What's due" value={it.what} onChange={(e) => set({ ...d, items: setAt(d.items, i, { what: e.target.value }) })} />
            <input type="date" className={inputClass} value={it.date} onChange={(e) => set({ ...d, items: setAt(d.items, i, { date: e.target.value }) })} />
            <RemoveButton onClick={() => set({ ...d, items: removeAt(d.items, i) })} />
          </div>
        ))}
        <AddButton onClick={() => set({ ...d, items: [...d.items, { what: "", date: "", notes: "" }] })}>Add a deadline</AddButton>
        <button type="button" onClick={download} disabled={!d.items.some((i) => i.what && i.date)}
          className="self-start mt-2 flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold bg-[#217A78] text-white disabled:opacity-40 hover:bg-[#1a6361]">
          <CalendarPlus size={14} /> Add to my calendar (.ics)
        </button>
        <p className="text-[11px] text-[#9A968A]">Works with Google Calendar (Settings, then Import), Apple Calendar, and Outlook. Each deadline gets a reminder one week before. Always confirm dates on each college&apos;s site.</p>
      </div>
    );
  },
  Doc: ({ data: d }) => (
    <div className="text-[13px]">
      <DocTitle sub={d.student || undefined}>College deadlines</DocTitle>
      <DocTable head={["Date", "What's due"]} rows={d.items.filter((i) => i.what).sort((a, b) => (a.date || "9").localeCompare(b.date || "9")).map((i) => [i.date ? fmtDate(i.date) : "TBD", i.what])} />
    </div>
  ),
};
