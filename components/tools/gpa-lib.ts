/* GPA math shared by the GPA calculator and the transcript builder.
   Common US convention; individual schools weight differently. */

export const GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"] as const;
export type Grade = (typeof GRADES)[number];
export const POINTS: Record<Grade, number> = {
  "A+": 4.0, A: 4.0, "A-": 3.7, "B+": 3.3, B: 3.0, "B-": 2.7, "C+": 2.3, C: 2.0, "C-": 1.7, "D+": 1.3, D: 1.0, "D-": 0.7, F: 0,
};
export type Level = "Regular" | "Honors" | "AP / IB / Dual enrollment";
export const LEVELS: Level[] = ["Regular", "Honors", "AP / IB / Dual enrollment"];
const BONUS: Record<Level, number> = { Regular: 0, Honors: 0.5, "AP / IB / Dual enrollment": 1 };

export interface Course { name: string; grade: Grade; credits: string; level: Level }

export function gpa(courses: Course[]) {
  let credits = 0, un = 0, w = 0;
  for (const c of courses) {
    const cr = parseFloat(c.credits);
    if (!(cr > 0)) continue;
    const p = POINTS[c.grade];
    credits += cr;
    un += p * cr;
    w += (p > 0 ? p + BONUS[c.level] : 0) * cr;
  }
  return { credits, unweighted: credits ? un / credits : 0, weighted: credits ? w / credits : 0 };
}
export const fmtGpa = (n: number) => n.toFixed(2);
export const newCourse = (): Course => ({ name: "", grade: "A", credits: "1", level: "Regular" });
