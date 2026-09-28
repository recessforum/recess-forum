"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, Plus, Trash2, XCircle } from "lucide-react";

type Plan = "ED" | "ED2" | "EA" | "REA" | "RD";
const PLANS: { id: Plan; label: string; hint: string }[] = [
  { id: "ED", label: "Early Decision (ED I)", hint: "Binding. One school." },
  { id: "ED2", label: "Early Decision II", hint: "Binding. Later deadline." },
  { id: "EA", label: "Early Action (EA)", hint: "Not binding." },
  { id: "REA", label: "Restrictive / Single-Choice EA", hint: "Not binding, limits other early apps." },
  { id: "RD", label: "Regular Decision", hint: "Not binding." },
];
interface School { name: string; plan: Plan; isPublic: boolean }
type Level = "error" | "warn" | "ok" | "info";
interface Finding { level: Level; text: string }

function check(schools: School[]): Finding[] {
  const named = schools.map((s, i) => ({ ...s, name: s.name.trim() || `School ${i + 1}` }));
  const by = (p: Plan) => named.filter((s) => s.plan === p);
  const ed = by("ED"), ed2 = by("ED2"), ea = by("EA"), rea = by("REA");
  const names = (xs: School[]) => xs.map((s) => s.name).join(", ");
  const out: Finding[] = [];

  if (ed.length > 1) out.push({ level: "error", text: `Only one Early Decision (ED I) application is allowed at a time, because ED is binding. You have ${ed.length}: ${names(ed)}.` });
  if (ed2.length > 1) out.push({ level: "error", text: `Only one ED II application is allowed at a time. You have ${ed2.length}: ${names(ed2)}.` });
  if (rea.length > 1) out.push({ level: "error", text: `Restrictive / Single-Choice EA usually lets you apply early to only that one private school. You have ${rea.length}: ${names(rea)}.` });
  if (rea.length && ed.length) out.push({ level: "error", text: `${names(rea)} (Restrictive EA) usually does not allow an Early Decision application elsewhere. ${names(ed)} is ED.` });
  const privateEa = ea.filter((s) => !s.isPublic);
  if (rea.length && privateEa.length) out.push({ level: "warn", text: `Most Restrictive EA schools don't allow Early Action at other private colleges (${names(privateEa)}). Check ${names(rea)}'s exact policy.` });
  const publicEa = ea.filter((s) => s.isPublic);
  if (rea.length && publicEa.length) out.push({ level: "info", text: `Early Action at public universities (${names(publicEa)}) is often allowed alongside Restrictive EA, but confirm with ${names(rea)}.` });

  if (ed.length === 1 && ea.length && !rea.length) out.push({ level: "ok", text: `One ED plus Early Action (${names(ea)}) is the most common combination. If ${ed[0].name} admits your student, you withdraw every other application.` });
  if (ed.length === 1 && ed2.length === 1) out.push({ level: "info", text: `ED II (${ed2[0].name}) is usually a second chance if ${ed[0].name} says no or defers. If ${ed[0].name} admits your student in ED I, withdraw the ED II application.` });
  if ((ed.length || ed2.length) && !out.some((f) => f.level === "error")) {
    out.push({ level: "warn", text: "ED is a binding commitment. Families can usually be released only if the financial aid offered makes attending not affordable. Run each school's net price calculator before applying ED." });
  }
  if (!ed.length && !ed2.length && !rea.length && ea.length) out.push({ level: "ok", text: "Early Action is not binding. You can apply EA to as many schools as you like and decide by May 1." });

  const has = (p: Plan) => named.some((s) => s.plan === p);
  if (has("ED") || has("EA") || has("REA")) out.push({ level: "info", text: "Timeline: most ED, EA, and REA deadlines are November 1 or 15. Most early results arrive in mid-December." });
  if (has("ED2") || has("RD")) out.push({ level: "info", text: "Timeline: most ED II and Regular Decision deadlines are in early to mid January. May 1 is the usual national decision day." });
  return out;
}

const ICON = { error: XCircle, warn: AlertTriangle, ok: CheckCircle2, info: Info };
const TONE = {
  error: "border-[#E8C3CA] bg-[#FBF1F1] text-[#9C3B4A]",
  warn: "border-[#EBD7A8] bg-[#FBF5E6] text-[#8A6A2A]",
  ok: "border-[#BFE0DE] bg-[#E4F2F1] text-[#217A78]",
  info: "border-[#DCE3EC] bg-[#F2F5F9] text-[#3D5A7A]",
};

export default function EarlyDecisionPage() {
  const [schools, setSchools] = useState<School[]>([
    { name: "", plan: "ED", isPublic: false },
    { name: "", plan: "EA", isPublic: true },
  ]);
  const findings = useMemo(() => check(schools), [schools]);
  const update = (i: number, patch: Partial<School>) => setSchools((ss) => ss.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const inputClass = "w-full px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A]";

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 w-full">
      <Link href="/tools" className="text-[13px] text-[#9A968A] hover:text-[#26364A]">&larr; Free tools</Link>
      <h1 className="text-[26px] font-semibold text-[#1C1B19] mt-2 mb-2 leading-snug">Early Decision plan checker</h1>
      <p className="text-[14px] text-[#5B584F] leading-relaxed mb-8">
        ED, EA, REA, ED II... List your student&apos;s colleges and the plan for each. We&apos;ll flag combinations that usually
        conflict and what to double-check before the deadline.
      </p>

      <div className="flex flex-col gap-3">
        {schools.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.3fr_1.2fr_auto_auto] gap-2 items-center p-3 border border-[#E6E3DA] bg-white">
            <input className={`${inputClass} col-span-2 sm:col-span-1`} placeholder={`College ${i + 1}`} value={s.name} onChange={(e) => update(i, { name: e.target.value })} />
            <select className={inputClass} value={s.plan} onChange={(e) => update(i, { plan: e.target.value as Plan })}>
              {PLANS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-[12px] text-[#5B584F] whitespace-nowrap px-1">
              <input type="checkbox" checked={s.isPublic} onChange={(e) => update(i, { isPublic: e.target.checked })} /> Public
            </label>
            <button aria-label="Remove" onClick={() => setSchools((ss) => ss.filter((_, j) => j !== i))} className="p-2 text-[#9A968A] hover:text-[#B23B3B]">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button onClick={() => setSchools((ss) => [...ss, { name: "", plan: "EA", isPublic: false }])}
          className="self-start flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border border-dashed border-[#C9C4B6] text-[#5B584F] hover:border-[#26364A]">
          <Plus size={14} /> Add a college
        </button>
      </div>

      <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mt-10 mb-3">What to know</h2>
      <div className="flex flex-col gap-2">
        {findings.length === 0 && <p className="text-[14px] text-[#9A968A] italic">Add a college to see results.</p>}
        {findings.map((f, i) => {
          const Icon = ICON[f.level];
          return (
            <div key={i} className={`flex items-start gap-2.5 p-3.5 border text-[14px] leading-relaxed ${TONE[f.level]}`}>
              <Icon size={17} className="shrink-0 mt-0.5" /><span className="text-[#1C1B19]">{f.text}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[12px] text-[#9A968A] leading-relaxed mt-4">
        Every college sets its own early policy, and rules change. Always read each school&apos;s early application page. This is general information, not admissions advice.
      </p>

      <div className="mt-10 p-6 bg-[#F5EFDD] border border-[#E6D6AE]">
        <h2 className="text-[16px] font-semibold text-[#1C1B19] mb-1">Still deciding where to use ED?</h2>
        <p className="text-[14px] text-[#5B584F] leading-relaxed mb-4">Parents of seniors and Verified college counselors are answering early-round questions right now.</p>
        <Link href="/signup" className="inline-block text-[14px] font-semibold text-white bg-[#26364A] px-5 py-2.5 hover:bg-[#1C2836]">Ask the Recess community</Link>
      </div>
    </div>
  );
}
