import type { ToolDef } from "./types";
import { iepLetter } from "./iep-letter";
import { earlyDecision } from "./early-decision";
import { gpaCalculator } from "./gpa-calculator";
import { homeschoolTranscript } from "./homeschool-transcript";
import { homeschoolWithdrawalLetter } from "./homeschool-withdrawal-letter";
import { aidComparison } from "./aid-comparison";
import { accommodations } from "./accommodations";
import { gradeCalculator } from "./grade-calculator";
import { schoolTourChecklist } from "./school-tour-checklist";
import { iepGoalTracker } from "./iep-goal-tracker";
import { homeschoolHoursLog } from "./homeschool-hours-log";
import { collegeDeadlines } from "./college-deadlines";
import { satActConverter } from "./sat-act-converter";
import { nyIhip, nyQuarterlyReport } from "./ny-homeschool";

// Keyed by slug in lib/tools.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TOOL_DEFS: Record<string, ToolDef<any>> = {
  "iep-letter": iepLetter,
  "early-decision": earlyDecision,
  "gpa-calculator": gpaCalculator,
  "homeschool-transcript": homeschoolTranscript,
  "homeschool-withdrawal-letter": homeschoolWithdrawalLetter,
  "aid-comparison": aidComparison,
  accommodations,
  "grade-calculator": gradeCalculator,
  "school-tour-checklist": schoolTourChecklist,
  "iep-goal-tracker": iepGoalTracker,
  "homeschool-hours-log": homeschoolHoursLog,
  "college-deadlines": collegeDeadlines,
  "sat-act-converter": satActConverter,
  "ny-ihip": nyIhip,
  "ny-quarterly-report": nyQuarterlyReport,
};
