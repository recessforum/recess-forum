export interface Topic {
  id: string;
  label: string;
  blurb: string;
}

export interface Category {
  id: string;
  label: string;
  topics: Topic[];
}

/* ---------------------------------------------------------------------- */
/*  Topic taxonomy — finalized product decisions, not placeholder.        */
/*  See ../frontend/recess-forum-handoff.md section 4 before changing.    */
/* ---------------------------------------------------------------------- */
export const CATEGORIES: Category[] = [
  {
    id: "school-types", label: "School Types",
    topics: [
      { id: "public-school", label: "Public School", blurb: "Enrollment, districts, and public school life." },
      { id: "private-school", label: "Private School", blurb: "Admissions, tuition, and private school experiences." },
      { id: "charter-school", label: "Charter School", blurb: "Lotteries, charters vs. district schools." },
      { id: "homeschool", label: "Homeschooling", blurb: "Curriculum, legal requirements, day-to-day homeschool life." },
      { id: "online-school", label: "Online / Virtual School", blurb: "Full-time virtual programs and hybrid setups." },
    ],
  },
  {
    id: "grade-stages", label: "Grade & Age Stages",
    topics: [
      { id: "early-childhood", label: "Early Childhood / Pre-K", blurb: "Preschool prep and early learning." },
      { id: "elementary", label: "Elementary", blurb: "K–5 school life and learning." },
      { id: "middle-school", label: "Middle School", blurb: "The 6th–8th grade stretch." },
      { id: "high-school", label: "High School", blurb: "Coursework, transcripts, and teen school life." },
    ],
  },
  {
    id: "college-prep", label: "College Prep & Admissions",
    topics: [
      { id: "college-applications", label: "Applications & Essays", blurb: "Personal statements, supplements, and building a strong application." },
      { id: "test-prep", label: "SAT / ACT Test Prep", blurb: "Test strategy, timelines, and prep resources." },
      { id: "college-research", label: "College List & Research", blurb: "Finding the right fit and building a balanced list." },
      { id: "extracurricular-strategy", label: "Extracurricular & Resume Strategy", blurb: "Activities, leadership, and how admissions actually reads a resume." },
      { id: "early-decision", label: "Early Decision / Early Action", blurb: "ED/EA strategy and weighing the tradeoffs." },
      { id: "college-financial-aid", label: "College Financial Aid & Scholarships", blurb: "FAFSA, merit aid, and paying for college." },
    ],
  },
  {
    id: "academics", label: "Academics & Curriculum",
    topics: [
      { id: "curriculum", label: "Curriculum & Lesson Planning", blurb: "Choosing and building what kids actually learn." },
      { id: "reading-literacy", label: "Reading & Literacy", blurb: "Phonics, reading levels, and building readers." },
      { id: "math-help", label: "Math Help", blurb: "From arithmetic struggles to algebra and beyond." },
      { id: "stem", label: "STEM", blurb: "Science, tech, engineering, and math enrichment." },
      { id: "testing", label: "Standardized Testing (State & Classroom)", blurb: "State tests, benchmark exams, and classroom assessment." },
    ],
  },
  {
    id: "support-needs", label: "Support Needs",
    topics: [
      { id: "special-ed", label: "Special Education & IEPs", blurb: "IEPs, 504 plans, and navigating school support." },
      { id: "learning-differences", label: "Learning Differences (ADHD, Dyslexia, etc.)", blurb: "Diagnoses, accommodations, and daily strategies." },
      { id: "gifted", label: "Gifted & Talented", blurb: "Advanced programs and keeping kids challenged." },
      { id: "ell", label: "English Language Learners", blurb: "Multilingual households and ELL support." },
    ],
  },
  {
    id: "enrichment", label: "Enrichment",
    topics: [
      { id: "tutoring", label: "Tutoring", blurb: "Finding tutors, pricing, and knowing when it helps." },
      { id: "extracurriculars", label: "Extracurriculars & Sports", blurb: "Balancing activities with school." },
      { id: "arts-music", label: "Arts & Music", blurb: "Lessons, recitals, and creative development." },
      { id: "summer-programs", label: "Summer Programs", blurb: "Camps, summer learning, and avoiding the slide." },
    ],
  },
  {
    id: "wellbeing", label: "Wellbeing & Social",
    topics: [
      { id: "mental-health", label: "Mental Health & Anxiety", blurb: "School stress, anxiety, and emotional support." },
      { id: "bullying", label: "Bullying", blurb: "Recognizing it and working with schools on it." },
      { id: "screen-time", label: "Screen Time & Technology", blurb: "Devices, social media, and school-issued tech." },
      { id: "motivation", label: "Motivation & Discipline", blurb: "Getting kids engaged and holding boundaries." },
    ],
  },
  {
    id: "fun", label: "Fun & Family Time",
    topics: [
      { id: "weekend-activities", label: "Weekend & Day Trip Ideas", blurb: "Where to go and what to do together." },
      { id: "hobbies-crafts", label: "Hobbies & Crafts", blurb: "Projects, collections, and things kids get into." },
      { id: "games-play", label: "Games & Imaginative Play", blurb: "Board games, pretend play, and just having fun." },
      { id: "birthday-celebrations", label: "Birthdays & Celebrations", blurb: "Party ideas, themes, and making occasions special." },
      { id: "books-media", label: "Books, Shows & Movies for Kids", blurb: "What's actually worth their (and your) time." },
      { id: "family-traditions", label: "Family Traditions & Rituals", blurb: "The little things that make your family yours." },
      { id: "travel-with-kids", label: "Traveling with Kids", blurb: "Trip tips, packing, and surviving the flight." },
      { id: "screen-free-fun", label: "Screen-Free Fun Ideas", blurb: "Activities that don't involve a device." },
    ],
  },
  {
    id: "logistics", label: "Logistics & Parent Life",
    topics: [
      { id: "school-choice", label: "School Choice & Enrollment", blurb: "Picking a school and navigating enrollment." },
      { id: "financial-aid", label: "Financial Aid & Scholarships", blurb: "Tuition costs, aid, and scholarships." },
      { id: "teacher-comm", label: "Teacher & School Communication", blurb: "Conferences, emails, and advocating for your kid." },
      { id: "general-parenting", label: "General Parenting", blurb: "Everything else about raising a student." },
    ],
  },
];

export const ALL_TOPICS = CATEGORIES.flatMap((c) => c.topics.map((t) => ({ ...t, categoryId: c.id })));
export const topicById = (id: string) => ALL_TOPICS.find((t) => t.id === id);
export const topicLabel = (id: string) => topicById(id)?.label || id;
export const categoryOf = (topicId: string) => CATEGORIES.find((c) => c.id === topicById(topicId)?.categoryId);

interface ColorTriple {
  text: string;
  bg: string;
  solid: string;
}

/* One muted, distinct color per category — used consistently for that
   category's topic badges, sidebar accents, and topic banner. */
export const CATEGORY_COLORS: Record<string, ColorTriple> = {
  "school-types": { text: "#3B5BA5", bg: "#E9EEF7", solid: "#3B5BA5" },
  "grade-stages": { text: "#3F7A52", bg: "#E9F2EC", solid: "#3F7A52" },
  "college-prep": { text: "#9C3B4A", bg: "#F5E4E7", solid: "#9C3B4A" },
  academics: { text: "#A8791E", bg: "#F6EFDD", solid: "#A8791E" },
  "support-needs": { text: "#8C4F86", bg: "#F3E9F2", solid: "#8C4F86" },
  enrichment: { text: "#217A78", bg: "#E4F2F1", solid: "#217A78" },
  wellbeing: { text: "#B85A3A", bg: "#F7E9E2", solid: "#B85A3A" },
  fun: { text: "#C15B7A", bg: "#F7E6EC", solid: "#C15B7A" },
  logistics: { text: "#5C5AA0", bg: "#ECEBF6", solid: "#5C5AA0" },
};

export const colorForCategory = (categoryId?: string): ColorTriple =>
  (categoryId && CATEGORY_COLORS[categoryId]) || { text: "#26364A", bg: "#EFEDE6", solid: "#26364A" };

export const colorForTopic = (topicId: string) => colorForCategory(topicById(topicId)?.categoryId);
