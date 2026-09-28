"use client";

import { DocTitle, Field, Select, Text } from "./ui";
import type { ToolDef } from "./types";

/* Official ACT/SAT concordance (ACT and College Board, 2018): ACT composite ->
   SAT total range and single concordant score. */
const TABLE: [number, number, number, number][] = [
  [36, 1570, 1600, 1590], [35, 1530, 1560, 1540], [34, 1490, 1520, 1500], [33, 1450, 1480, 1460], [32, 1420, 1440, 1430],
  [31, 1390, 1410, 1400], [30, 1360, 1380, 1370], [29, 1330, 1350, 1340], [28, 1300, 1320, 1310], [27, 1260, 1290, 1280],
  [26, 1230, 1250, 1240], [25, 1200, 1220, 1210], [24, 1160, 1190, 1180], [23, 1130, 1150, 1140], [22, 1100, 1120, 1110],
  [21, 1060, 1090, 1080], [20, 1030, 1050, 1040], [19, 990, 1020, 1010], [18, 960, 980, 970], [17, 920, 950, 930],
  [16, 880, 910, 890], [15, 830, 870, 850], [14, 780, 820, 800], [13, 730, 770, 760], [12, 690, 720, 710],
  [11, 650, 680, 670], [10, 620, 640, 630], [9, 590, 610, 590],
];

interface D { from: "SAT" | "ACT"; score: string }

function convert(d: D): string {
  const s = parseInt(d.score);
  if (!s) return "";
  if (d.from === "ACT") {
    const row = TABLE.find((r) => r[0] === s);
    return row ? `An ACT composite of ${s} is about ${row[3]} on the SAT (range ${row[1]}-${row[2]}).` : "Enter an ACT composite from 9 to 36.";
  }
  if (s < 400 || s > 1600) return "Enter an SAT total from 400 to 1600.";
  const rounded = Math.round(s / 10) * 10;
  const row = TABLE.find((r) => rounded >= r[1] && rounded <= r[2]);
  return row ? `An SAT total of ${s} is about a ${row[0]} on the ACT.` : "Below about 590, the scores don't have a published match.";
}

export const satActConverter: ToolDef<D> = {
  initial: () => ({ from: "SAT", score: "" }),
  titleOf: (d) => `${d.from} ${d.score} conversion`,
  Editor: ({ data: d, set }) => (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="I have a score on the"><Select value={d.from} onChange={(v) => set({ ...d, from: v })} options={[{ value: "SAT", label: "SAT (400-1600)" }, { value: "ACT", label: "ACT (1-36)" }]} /></Field>
        <Field label="Score"><Text value={d.score} onChange={(v) => set({ ...d, score: v.replace(/\D/g, "") })} placeholder={d.from === "SAT" ? "1250" : "27"} /></Field>
      </div>
      <p className="text-[12px] text-[#9A968A] leading-relaxed">Uses the official ACT/College Board concordance tables. Colleges use them to compare scores, but each college decides how to weigh tests. Check whether a college is test-optional.</p>
    </div>
  ),
  Doc: ({ data: d }) => (
    <div>
      <DocTitle>SAT and ACT conversion</DocTitle>
      <p className="text-[16px] text-[#1C1B19]">{convert(d) || "Enter a score to convert."}</p>
    </div>
  ),
};
