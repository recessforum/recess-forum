"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, Printer, ShieldCheck } from "lucide-react";

const CONCERNS = [
  "reading", "writing", "math", "attention and focus", "behavior", "speech or language",
  "social skills", "fine or gross motor skills", "emotional wellbeing or anxiety", "sensory needs",
];

const inputClass = "w-full px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] transition-colors";
const labelClass = "text-[12px] font-medium text-[#5B584F] block mb-1.5";

function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export default function IepLetterPage() {
  const [parent, setParent] = useState("");
  const [child, setChild] = useState("");
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [recipient, setRecipient] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [tried, setTried] = useState("");
  const [outside, setOutside] = useState("");
  const [copied, setCopied] = useState(false);

  const toggle = (c: string) => setConcerns((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));

  const letter = useMemo(() => {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const kid = child.trim() || "[child's name]";
    const lines = [
      today,
      "",
      recipient.trim() ? `Dear ${recipient.trim()},` : "Dear Principal and Special Education Coordinator,",
      "",
      `I am the parent of ${kid}, who is in ${grade.trim() || "[grade]"} at ${school.trim() || "[school name]"}. I am writing to request a full and individual evaluation of ${kid} to determine whether ${kid} is eligible for special education and related services under the Individuals with Disabilities Education Act (IDEA).`,
      "",
      concerns.length
        ? `I am concerned about ${kid}'s ${joinList(concerns)}.${details.trim() ? ` ${details.trim()}` : ""}`
        : details.trim() || `[Describe what you are seeing at home and at school.]`,
    ];
    if (tried.trim()) lines.push("", `So far we have tried: ${tried.trim()}`);
    if (outside.trim()) lines.push("", `Outside information that may help the team: ${outside.trim()} I am happy to share these reports.`);
    lines.push(
      "",
      `Please evaluate ${kid} in all areas of suspected disability. I understand the school needs my written consent before evaluating, so please send me the consent form and an evaluation plan as soon as possible. I also request a copy of the evaluation reports before any eligibility meeting so I have time to review them.`,
      "",
      `If the school decides not to evaluate, please give me that decision in writing (Prior Written Notice), including the reasons and the information you used.`,
      "",
      "Thank you for your help. I look forward to working with the team.",
      "",
      "Sincerely,",
      parent.trim() || "[Your name]",
      "[Phone number]",
      "[Email address]",
    );
    return lines.join("\n");
  }, [parent, child, grade, school, recipient, concerns, details, tried, outside]);

  const copy = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const print = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const esc = letter.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    w.document.write(`<html><head><title>IEP evaluation request</title></head><body style="font-family:Georgia,serif;font-size:15px;line-height:1.6;max-width:640px;margin:48px auto;white-space:pre-wrap">${esc}</body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 w-full">
      <Link href="/tools" className="text-[13px] text-[#9A968A] hover:text-[#26364A]">&larr; Free tools</Link>
      <h1 className="text-[26px] font-semibold text-[#1C1B19] mt-2 mb-2 leading-snug">IEP evaluation request letter</h1>
      <p className="text-[14px] text-[#5B584F] leading-relaxed mb-2 max-w-2xl">
        Asking in writing is the most important first step. It creates a record and starts the school&apos;s timeline.
        Fill in what you can, then copy, print, or email the letter to your child&apos;s principal and special education coordinator.
      </p>
      <p className="text-[12px] text-[#217A78] flex items-center gap-1.5 mb-8"><ShieldCheck size={13} /> Nothing you type here is saved or sent anywhere.</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Your name</label><input className={inputClass} value={parent} onChange={(e) => setParent(e.target.value)} /></div>
            <div><label className={labelClass}>Child&apos;s name</label><input className={inputClass} value={child} onChange={(e) => setChild(e.target.value)} /></div>
            <div><label className={labelClass}>Grade</label><input className={inputClass} placeholder="2nd grade" value={grade} onChange={(e) => setGrade(e.target.value)} /></div>
            <div><label className={labelClass}>School</label><input className={inputClass} value={school} onChange={(e) => setSchool(e.target.value)} /></div>
          </div>
          <div><label className={labelClass}>Addressed to (optional)</label><input className={inputClass} placeholder="Principal Garcia and Ms. Lee" value={recipient} onChange={(e) => setRecipient(e.target.value)} /></div>
          <div>
            <label className={labelClass}>Areas you&apos;re concerned about</label>
            <div className="flex flex-wrap gap-1.5">
              {CONCERNS.map((c) => {
                const on = concerns.includes(c);
                return (
                  <button key={c} type="button" onClick={() => toggle(c)} aria-pressed={on}
                    className={`text-[12px] font-medium px-2.5 py-1.5 rounded-sm transition-colors ${on ? "bg-[#26364A] text-white" : "bg-[#EFEDE6] text-[#5B584F] hover:bg-[#E6E3DA]"}`}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <div><label className={labelClass}>What you&apos;re seeing (examples help)</label>
            <textarea className={`${inputClass} min-h-[88px]`} placeholder="She still reverses letters and avoids reading aloud. Homework takes two hours and ends in tears." value={details} onChange={(e) => setDetails(e.target.value)} /></div>
          <div><label className={labelClass}>What you&apos;ve already tried (optional)</label>
            <textarea className={`${inputClass} min-h-[64px]`} placeholder="Reading tutor twice a week since March, extra help from her teacher." value={tried} onChange={(e) => setTried(e.target.value)} /></div>
          <div><label className={labelClass}>Outside evaluations or diagnoses (optional)</label>
            <input className={inputClass} placeholder="Our pediatrician diagnosed ADHD in June." value={outside} onChange={(e) => setOutside(e.target.value)} /></div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-[#5B584F] uppercase tracking-wide">Your letter</span>
            <div className="flex gap-2">
              <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold bg-[#26364A] text-white hover:bg-[#1e2c3d]">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={print} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium border border-[#E6E3DA] text-[#1C1B19] hover:bg-[#FAF9F7]">
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap font-serif text-[14px] leading-relaxed text-[#1C1B19] bg-white border border-[#E6E3DA] p-5 min-h-[520px]">{letter}</pre>
          <p className="text-[12px] text-[#9A968A] leading-relaxed mt-3">
            Tips: send it by email so you have a dated record, keep a copy, and follow up if you don&apos;t hear back within a week or two.
            Timelines for evaluations vary by state. This tool gives general information, not legal advice.
          </p>
        </div>
      </div>

      <div className="mt-12 p-6 bg-[#F5EFDD] border border-[#E6D6AE]">
        <h2 className="text-[16px] font-semibold text-[#1C1B19] mb-1">Not sure what comes next?</h2>
        <p className="text-[14px] text-[#5B584F] leading-relaxed mb-4">
          Ask parents who&apos;ve been through it, and Verified Experts who do this every day. It&apos;s free.
        </p>
        <Link href="/signup" className="inline-block text-[14px] font-semibold text-white bg-[#26364A] px-5 py-2.5 hover:bg-[#1C2836]">
          Ask the Recess community
        </Link>
      </div>
    </div>
  );
}
