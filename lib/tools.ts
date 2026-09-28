/* Registry of the free tools (data only, safe for server code like metadata
   and the sitemap). The editor/document components live in components/tools. */

export type ToolGroup = "IEP & special education" | "Homeschooling" | "College" | "Everyday school";

export interface ToolInfo {
  slug: string;
  title: string;
  blurb: string;
  group: ToolGroup;
  /** Short SEO description for the page <meta>. */
  description: string;
}

export const TOOLS: ToolInfo[] = [
  { slug: "iep-letter", group: "IEP & special education", title: "IEP evaluation request letter",
    blurb: "Write the formal letter asking the school to evaluate your child for special education.",
    description: "Free generator for a clear, formal IEP evaluation request letter. Copy, print, or save it." },
  { slug: "accommodations", group: "IEP & special education", title: "Accommodation idea finder",
    blurb: "Pick your child's challenges and get common IEP and 504 accommodations to bring to the meeting.",
    description: "Common IEP and 504 accommodations for ADHD, dyslexia, anxiety, autism, and more. Build a printable list." },
  { slug: "iep-goal-tracker", group: "IEP & special education", title: "IEP goal progress tracker",
    blurb: "Log progress on each IEP goal at home so you can bring real data to the next meeting.",
    description: "Track your child's IEP goals over time and print a progress summary for the IEP meeting." },
  { slug: "homeschool-withdrawal-letter", group: "Homeschooling", title: "Homeschool withdrawal letter",
    blurb: "Tell the school you're withdrawing to homeschool, in writing, so there's no truancy confusion.",
    description: "Free generator for a letter withdrawing your child from school to homeschool." },
  { slug: "homeschool-transcript", group: "Homeschooling", title: "Homeschool transcript builder",
    blurb: "Enter courses, credits, and grades. Get a college-ready transcript with GPA.",
    description: "Build a printable high school homeschool transcript with weighted and unweighted GPA." },
  { slug: "homeschool-hours-log", group: "Homeschooling", title: "Homeschool hours log",
    blurb: "Log instruction hours by subject and quarter, for states that require hours.",
    description: "Track homeschool instruction hours by subject and quarter and print a summary." },
  { slug: "ny-ihip", group: "Homeschooling", title: "NY homeschool IHIP",
    blurb: "Build New York's Individualized Home Instruction Plan with the required subjects for your child's grade.",
    description: "Free New York IHIP generator with the subjects required by grade under 8 NYCRR 100.10." },
  { slug: "ny-quarterly-report", group: "Homeschooling", title: "NY homeschool quarterly report",
    blurb: "Hours, material covered, and a grade or narrative for each subject, ready to send.",
    description: "Free New York homeschool quarterly report generator." },
  { slug: "early-decision", group: "College", title: "Early Decision plan checker",
    blurb: "ED, EA, REA, ED II: list your colleges and see which combinations usually work.",
    description: "Check whether your student's Early Decision, Early Action, and REA plans usually conflict." },
  { slug: "gpa-calculator", group: "College", title: "GPA calculator",
    blurb: "Weighted and unweighted GPA from your classes, including honors and AP.",
    description: "Free high school GPA calculator with weighted and unweighted GPA." },
  { slug: "aid-comparison", group: "College", title: "Financial aid offer comparison",
    blurb: "Compare aid offers side by side: free money vs loans, and the real 4-year cost.",
    description: "Compare college financial aid award letters: grants vs loans and 4-year net cost." },
  { slug: "college-deadlines", group: "College", title: "College deadline calendar",
    blurb: "Add each school's deadlines, then export them to Google or Apple Calendar.",
    description: "List college application deadlines and export them to your calendar." },
  { slug: "sat-act-converter", group: "College", title: "SAT and ACT score converter",
    blurb: "Convert between SAT and ACT scores with the official concordance table.",
    description: "Convert SAT to ACT and ACT to SAT scores using the official ACT and College Board concordance." },
  { slug: "grade-calculator", group: "Everyday school", title: "What grade will my child be in?",
    blurb: "Enter a birthday and your state's cutoff date to see grade by school year.",
    description: "Find out what grade your child will be in each school year based on the kindergarten cutoff date." },
  { slug: "school-tour-checklist", group: "Everyday school", title: "School tour checklist",
    blurb: "Questions to ask on a public, private, or charter school tour, with room for notes.",
    description: "Printable school tour questions for public, private, and charter schools." },
];

export const TOOL_BY_SLUG: Record<string, ToolInfo> = Object.fromEntries(TOOLS.map((t) => [t.slug, t]));
export const TOOL_GROUPS: ToolGroup[] = ["IEP & special education", "Homeschooling", "College", "Everyday school"];
