import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MessageSquare, ArrowUp, ArrowDown, Plus, X, ChevronLeft, ChevronDown,
  Loader2, Search, Flame, Clock, Trophy, MapPin, Eye,
  Rocket, Sprout, Star, Crown, ShieldCheck, BadgeCheck, Briefcase, Upload, CheckCircle2,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Topic taxonomy                                                         */
/* ---------------------------------------------------------------------- */
const CATEGORIES = [
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

const ALL_TOPICS = CATEGORIES.flatMap((c) => c.topics.map((t) => ({ ...t, categoryId: c.id })));
const topicById = (id) => ALL_TOPICS.find((t) => t.id === id);
const topicLabel = (id) => topicById(id)?.label || id;
const categoryOf = (topicId) => CATEGORIES.find((c) => c.id === topicById(topicId)?.categoryId);

/* One muted, distinct color per category — used consistently for that
   category's topic badges, sidebar accents, and topic banner. */
const CATEGORY_COLORS = {
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
const colorForCategory = (categoryId) => CATEGORY_COLORS[categoryId] || { text: "#26364A", bg: "#EFEDE6", solid: "#26364A" };
const colorForTopic = (topicId) => colorForCategory(topicById(topicId)?.categoryId);

/* Zip → state (approximate, by 3-digit prefix — good enough for a prototype;
   a real build should use a proper zip database or geocoding API).
   We only ever store/display the derived state, never the raw zip, to keep
   posts from exposing a parent's precise location. */
const ZIP3_RANGES = [
  [0, 5, "NY"], [6, 9, "PR"],
  [10, 27, "MA"], [28, 29, "RI"], [30, 38, "NH"], [39, 49, "ME"], [50, 59, "VT"], [60, 69, "CT"],
  [70, 89, "NJ"],
  [100, 149, "NY"],
  [150, 196, "PA"],
  [197, 199, "DE"],
  [200, 205, "DC"],
  [206, 219, "MD"],
  [220, 246, "VA"],
  [247, 268, "WV"],
  [270, 289, "NC"],
  [290, 299, "SC"],
  [300, 319, "GA"], [398, 399, "GA"],
  [320, 339, "FL"], [341, 349, "FL"],
  [350, 369, "AL"],
  [370, 385, "TN"],
  [386, 397, "MS"],
  [400, 427, "KY"],
  [430, 459, "OH"],
  [460, 479, "IN"],
  [480, 499, "MI"],
  [500, 528, "IA"],
  [530, 549, "WI"],
  [550, 567, "MN"],
  [570, 577, "SD"],
  [580, 588, "ND"],
  [590, 599, "MT"],
  [600, 629, "IL"],
  [630, 658, "MO"],
  [660, 679, "KS"],
  [680, 693, "NE"],
  [700, 714, "LA"],
  [716, 729, "AR"],
  [730, 731, "OK"], [734, 741, "OK"], [743, 749, "OK"],
  [750, 799, "TX"], [885, 885, "TX"],
  [800, 816, "CO"],
  [820, 831, "WY"],
  [832, 838, "ID"],
  [840, 847, "UT"],
  [850, 865, "AZ"],
  [870, 884, "NM"],
  [889, 898, "NV"],
  [900, 961, "CA"],
  [967, 968, "HI"],
  [970, 979, "OR"],
  [980, 994, "WA"],
  [995, 999, "AK"],
];

function zipToState(zip) {
  const digits = (zip || "").replace(/\D/g, "");
  if (digits.length < 3) return null;
  const prefix = parseInt(digits.slice(0, 3), 10);
  for (const [min, max, state] of ZIP3_RANGES) {
    if (prefix >= min && prefix <= max) return state;
  }
  return null;
}

const US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
  ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["DC","District of Columbia"],["FL","Florida"],
  ["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],
  ["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],
  ["MD","Maryland"],["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],
  ["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],
  ["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],
  ["OH","Ohio"],["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],
  ["SC","South Carolina"],["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],
  ["VT","Vermont"],["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],
  ["WY","Wyoming"],
].map(([code, name]) => ({ code, name }));

/* ---------------------------------------------------------------------- */
/*  Seed data                                                              */
/* ---------------------------------------------------------------------- */
const now = Date.now();
const SEED_POSTS = [
  { id: "seed-1", title: "How do you handle homework battles on school nights?",
    body: "My 9-year-old melts down over math worksheets every single night. Looking for what's actually worked for other parents — routines, rewards, anything.",
    author: "MiraP", topicId: "math-help", state: "TX", score: 14, views: 128, createdAt: now - 1000 * 60 * 60 * 5 },
  { id: "seed-2", title: "Switched to homeschooling mid-year — ask me anything",
    body: "We pulled our daughter out of 7th grade in October. It's been a big adjustment but a good one so far. Happy to share what curriculum we landed on.",
    author: "DKimFamily", topicId: "homeschool", state: "CA", score: 31, views: 340, createdAt: now - 1000 * 60 * 60 * 30 },
  { id: "seed-3", title: "Tutoring burnout is real — how many hours is too many?",
    body: "Our son does 6 hours/week of tutoring on top of a full school day and travel soccer. He seems fine but I keep wondering if we're overdoing it.",
    author: "growth_dad", topicId: "tutoring", state: "IL", score: 9, views: 64, createdAt: now - 1000 * 60 * 60 * 2 },
  { id: "seed-4", title: "504 plan got denied — anyone successfully appeal?",
    body: "School said his diagnosis didn't 'impact learning enough.' Feels like a wall. Has anyone pushed back and won?",
    author: "quietstormom", topicId: "special-ed", state: "OH", score: 22, views: 201, createdAt: now - 1000 * 60 * 60 * 14 },
  { id: "seed-5", title: "How many APs is actually 'enough' for competitive admissions?",
    body: "Junior year and I keep hearing conflicting advice — some say 5+ APs, others say depth over breadth matters more. What actually moved the needle for your kid's applications?",
    author: "collegecountdown", topicId: "college-applications", state: "NY", score: 41, views: 512, createdAt: now - 1000 * 60 * 60 * 8 },
  { id: "seed-6", title: "Best rainy-day activities that aren't screens?",
    body: "We've done every craft on Pinterest at this point. Looking for fresh ideas for a 7 and 9 year old that don't end in a screen or a meltdown.",
    author: "puddlejumper", topicId: "screen-free-fun", state: "WA", score: 19, views: 156, createdAt: now - 1000 * 60 * 60 * 6 },
  { id: "seed-7", title: "Family road trip tips for a first-timer with 3 kids under 10?",
    body: "Doing a 6-hour drive this summer for the first time with all three. Snacks, entertainment, timing — tell me everything that's worked for you.",
    author: "vanlife_mama", topicId: "travel-with-kids", state: "CO", score: 27, views: 203, createdAt: now - 1000 * 60 * 60 * 20 },
];

const SEED_COMMENTS = {
  "seed-1": [
    { id: "c1", postId: "seed-1", parentId: null, author: "OldSchoolMom", body: "Timer + a 5 min break every 15 minutes changed everything for us.", score: 8, createdAt: now - 1000 * 60 * 50 },
    { id: "c2", postId: "seed-1", parentId: "c1", author: "MiraP", body: "Trying this tonight, thank you!", score: 3, createdAt: now - 1000 * 60 * 40 },
  ],
  "seed-2": [
    { id: "c3", postId: "seed-2", parentId: null, author: "TeachAtHomeDad", body: "What curriculum did you land on? We're considering the same move.", score: 5, createdAt: now - 1000 * 60 * 60 * 10 },
  ],
  "seed-4": [
    { id: "c4", postId: "seed-4", parentId: null, author: "RecessTeam", body: "Reminder: our Special Ed & IEPs topic pins a state-by-state guide to the appeals process — worth checking before your hearing.", score: 6, createdAt: now - 1000 * 60 * 60 * 12 },
  ],
};

/* ---------------------------------------------------------------------- */
/*  Ranking + helpers                                                      */
/* ---------------------------------------------------------------------- */
function hotScore(score, views, createdAt) {
  const ageHours = (Date.now() - createdAt) / 1000 / 60 / 60;
  const voteOrder = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const viewOrder = Math.log10((views || 0) + 1) * 0.4; // views count, but weighted less than votes
  return sign * voteOrder + viewOrder - ageHours / 12;
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const RANGE_MS = { day: 864e5, week: 6048e5, month: 2592e6, all: Infinity };

function karmaFor(author, posts, comments) {
  let total = 0;
  posts.forEach((p) => { if (p.author === author) total += p.score; });
  Object.values(comments).flat().forEach((c) => { if (c.author === author) total += c.score; });
  return total;
}

/* ---------------------------------------------------------------------- */
/*  Membership tiers — earned automatically from activity                 */
/* ---------------------------------------------------------------------- */
const TIERS = [
  { id: "elite", label: "Elite", posts: 50, comments: 100, icon: Crown, text: "#A8791E", bg: "#F6EFDD" },
  { id: "senior", label: "Senior", posts: 20, comments: 80, icon: Star, text: "#5C5AA0", bg: "#ECEBF6" },
  { id: "junior", label: "Junior", posts: 10, comments: 50, icon: Sprout, text: "#3F7A52", bg: "#E9F2EC" },
  { id: "rising", label: "Rising", posts: 2, comments: 10, icon: Rocket, text: "#3B5BA5", bg: "#E9EEF7" },
];

function countsFor(author, posts, comments) {
  const postCount = posts.filter((p) => p.author === author).length;
  const commentCount = Object.values(comments).flat().filter((c) => c.author === author).length;
  return { postCount, commentCount };
}

function tierFor(author, posts, comments) {
  const { postCount, commentCount } = countsFor(author, posts, comments);
  return TIERS.find((t) => postCount >= t.posts && commentCount >= t.comments) || null;
}

/* Credential badges — separate from activity tier, granted by the site
   (Administrator) or via a separate verification application (Verified
   Expert). In a real build this would come from a backend record; here
   it's a lookup keyed by display name for demo purposes. */
const AUTHOR_ROLES = {
  RecessTeam: { role: "admin" },
  quietstormom: { role: "verified_expert", expertType: "Special Education Law Attorney" },
  collegecountdown: { role: "verified_expert", expertType: "College Admissions Counselor" },
};

const EXPERT_TYPES = [
  "Certified Teacher", "School Counselor / College Admissions Counselor", "School Psychologist",
  "Clinical Psychologist", "Educational / Neuropsychologist", "Psychiatrist",
  "Psychiatric Nurse Practitioner (PMHNP)", "Pediatric Neurologist",
  "Board Certified Behavior Analyst (BCBA)", "ADHD / Executive Function Coach",
  "Occupational Therapist", "Speech-Language Pathologist", "Physical Therapist", "ABA Therapist",
  "Education Law Attorney", "Special Education Law Attorney", "School District Administrator",
  "Education Consultant", "ESL / Bilingual Education Specialist", "School Social Worker",
  "Developmental Pediatrician", "Financial Aid Advisor", "Homeschool Curriculum Specialist",
  "Gifted Education Specialist",
];

function roleFor(author) { return AUTHOR_ROLES[author] || null; }

function TierBadge({ tier }) {
  if (!tier) return null;
  const Icon = tier.icon;
  return (
    <span style={{ backgroundColor: tier.bg, color: tier.text }}
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-sm">
      <Icon size={11} /> {tier.label}
    </span>
  );
}

function RoleBadge({ role }) {
  if (!role) return null;
  if (role.role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#FBEAEA] text-[#B23B3B]">
        <ShieldCheck size={11} /> Administrator
      </span>
    );
  }
  return (
    <span title={role.expertType}
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#E4F2F1] text-[#217A78]">
      <BadgeCheck size={11} /> Verified Expert
    </span>
  );
}

function AuthorBadges({ tier, role }) {
  if (!tier && !role) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <RoleBadge role={role} />
      <TierBadge tier={tier} />
    </span>
  );
}

/* ---------------------------------------------------------------------- */
/*  Design tokens (inline for clarity)                                     */
/*  bg #F7F6F3 · surface #FFFFFF · ink #1C1B19 · muted #7A766D             */
/*  hairline #E6E3DA · accent #26364A · gold (vote-active only) #B08D45   */
/* ---------------------------------------------------------------------- */

function RecessMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#26364A" />
      <g transform="translate(20,14)">
        <circle cx="30" cy="8" r="3.5" fill="#F7F6F3" />
        <rect x="28" y="10" width="4" height="6" fill="#F7F6F3" />
        <path d="M10,42 Q10,15 30,15 Q50,15 50,42 L56,50 Q56,56 50,56 L10,56 Q4,56 4,50 Z" fill="#F7F6F3" />
        <rect x="4" y="56" width="52" height="4" rx="2" fill="#F7F6F3" />
        <line x1="30" y1="60" x2="30" y2="66" stroke="#F7F6F3" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="30" cy="71" r="4.5" fill="#B08D45" />
      </g>
    </svg>
  );
}

function VoteControl({ score, dir, onVote, vertical = true }) {
  return (
    <div className={`flex ${vertical ? "flex-col" : "flex-row"} items-center gap-1`}>
      <button onClick={(e) => { e.stopPropagation(); onVote(1); }}
        className={`transition-colors ${dir === 1 ? "text-[#B08D45]" : "text-[#B7B3A8] hover:text-[#26364A]"}`} aria-label="Upvote">
        <ArrowUp size={vertical ? 16 : 14} strokeWidth={2.25} />
      </button>
      <span className="text-[13px] font-medium text-[#1C1B19] tabular-nums min-w-[1.5ch] text-center">{score}</span>
      <button onClick={(e) => { e.stopPropagation(); onVote(-1); }}
        className={`transition-colors ${dir === -1 ? "text-[#26364A]" : "text-[#B7B3A8] hover:text-[#26364A]"}`} aria-label="Downvote">
        <ArrowDown size={vertical ? 16 : 14} strokeWidth={2.25} />
      </button>
    </div>
  );
}

function TopicRow({ topic, categoryId, active, onClick }) {
  const c = colorForCategory(categoryId);
  return (
    <button onClick={onClick}
      style={{ borderLeftColor: active ? c.solid : "transparent", backgroundColor: active ? c.bg : "transparent" }}
      className="text-left px-2.5 py-1.5 text-[13px] w-full border-l-2 transition-colors flex items-center gap-2 hover:bg-[#EFEDE6]">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.solid }} />
      <span className={active ? "font-semibold text-[#1C1B19]" : "text-[#5B584F]"}>{topic.label}</span>
    </button>
  );
}

function TopicBadge({ topicId, onClick }) {
  const c = colorForTopic(topicId);
  return (
    <button onClick={onClick} style={{ backgroundColor: c.bg, color: c.text }}
      className="text-[12px] font-medium px-2 py-0.5 rounded-sm inline-block hover:opacity-80 transition-opacity">
      {topicLabel(topicId)}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/*  Post row (feed)                                                        */
/* ---------------------------------------------------------------------- */
function PostRow({ post, commentCount, onOpen, onVote, dir, onTopic, badgesFor }) {
  return (
    <div className="flex gap-4 py-4 border-b border-[#E6E3DA] cursor-pointer group" onClick={() => onOpen(post.id)}>
      <div className="shrink-0 pt-0.5">
        <VoteControl score={post.score} dir={dir} onVote={(d) => onVote(post.id, d)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5">
          <TopicBadge topicId={post.topicId} onClick={(e) => { e.stopPropagation(); onTopic(post.topicId); }} />
        </div>
        <h3 className="text-[16px] font-semibold leading-snug text-[#1C1B19] mb-1 group-hover:text-[#26364A] transition-colors">
          {post.title}
        </h3>
        <p className="text-[14px] text-[#5B584F] leading-relaxed line-clamp-2 mb-1.5">{post.body}</p>
        {post.promo && (
          <div className="flex items-center gap-1 text-[11px] text-[#217A78] mb-1.5">
            <Briefcase size={11} /> {post.promo.label}
          </div>
        )}
        <div className="flex items-center gap-2 text-[12px] text-[#9A968A]">
          <span>{post.author}</span>
          <AuthorBadges {...badgesFor(post.author)} />
          {post.state && (
            <span className="flex items-center gap-0.5">
              <MapPin size={11} /> {post.state}
            </span>
          )}
          <span>·</span>
          <span>{timeAgo(post.createdAt)}</span>
          <span className="flex items-center gap-1 ml-auto">
            <Eye size={12} /> {post.views || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={12} /> {commentCount}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  New post modal                                                         */
/* ---------------------------------------------------------------------- */
function NewPostModal({ defaultTopic, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [zip, setZip] = useState("");
  const [state, setState] = useState("");
  const [topicId, setTopicId] = useState(defaultTopic || ALL_TOPICS[0].id);
  const [promoLabel, setPromoLabel] = useState("");
  const [promoUrl, setPromoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const canSubmit = title.trim() && body.trim() && author.trim() && state && !saving;
  const inputClass = "w-full px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] transition-colors";
  const expertRole = roleFor(author.trim());
  const isVerifiedExpert = expertRole?.role === "verified_expert";

  const handleZipChange = (val) => {
    setZip(val);
    const digits = val.replace(/\D/g, "");
    if (digits.length >= 3) {
      const detected = zipToState(digits);
      if (detected) setState(detected);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(28,27,25,0.55)" }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E3DA]">
          <h2 className="text-[17px] font-semibold text-[#1C1B19]">Start a discussion</h2>
          <button onClick={onClose} className="text-[#9A968A] hover:text-[#1C1B19]"><X size={18} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Your name</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="How should we sign your post?" className={inputClass} />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's your question or insight?" className={inputClass} />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Details</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Give other parents the context they need to help."
              className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <div>
              <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">
                Current state <span className="text-[#B85A3A]">*</span>
              </label>
              <select value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
                <option value="">Select a state</option>
                {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">
                Zip code <span className="text-[#9A968A] font-normal">(optional)</span>
              </label>
              <input value={zip} onChange={(e) => handleZipChange(e.target.value)} placeholder="e.g. 90210" inputMode="numeric" maxLength={10} className={inputClass} />
            </div>
          </div>
          <p className="text-[12px] text-[#9A968A] -mt-2">
            We only ever show your state, never your zip — typing a zip just auto-fills the state for you.
          </p>
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Topic</label>
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={inputClass}>
              {CATEGORIES.map((c) => (
                <optgroup key={c.id} label={c.label}>
                  {c.topics.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          {isVerifiedExpert && (
            <div className="border-t border-[#E6E3DA] pt-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Briefcase size={13} className="text-[#217A78]" />
                <span className="text-[12px] font-semibold text-[#217A78]">Verified Expert perk: mention your practice</span>
              </div>
              <input value={promoLabel} onChange={(e) => setPromoLabel(e.target.value.slice(0, 70))} placeholder="e.g. I offer IEP advocacy consults — Bright Path Advocacy"
                className={`${inputClass} mb-2`} maxLength={70} />
              <input value={promoUrl} onChange={(e) => setPromoUrl(e.target.value)} placeholder="Link (optional)" className={inputClass} />
              <p className="text-[11px] text-[#9A968A] mt-1.5">One line, shown as a small tag on your post — not a full ad.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#E6E3DA] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-medium text-[#5B584F] hover:text-[#1C1B19]">Cancel</button>
          <button disabled={!canSubmit}
            onClick={async () => {
              setSaving(true);
              const promo = isVerifiedExpert && promoLabel.trim() ? { label: promoLabel.trim(), url: promoUrl.trim() || null } : null;
              await onSubmit({ title: title.trim(), body: body.trim(), author: author.trim(), topicId, state, promo });
              setSaving(false);
            }}
            className="px-4 py-2 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-2 hover:bg-[#1e2c3d] transition-colors">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Verified Expert application                                           */
/* ---------------------------------------------------------------------- */
function ExpertApplicationModal({ onClose, onSubmit }) {
  const [author, setAuthor] = useState("");
  const [expertType, setExpertType] = useState(EXPERT_TYPES[0]);
  const [credentialInfo, setCredentialInfo] = useState("");
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const inputClass = "w-full px-3 py-2.5 border border-[#E6D9C4] bg-white text-[14px] outline-none focus:border-[#26364A] transition-colors";
  const canSubmit = author.trim() && credentialInfo.trim() && !saving;

  if (done) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(28,27,25,0.55)" }}>
        <div className="w-full max-w-sm p-6 text-center" style={{ backgroundColor: "#FDF1E5", border: "1px solid #F0C99B" }}>
          <CheckCircle2 size={32} className="text-[#217A78] mx-auto mb-3" />
          <h2 className="text-[16px] font-semibold text-[#1C1B19] mb-1.5">Application submitted</h2>
          <p className="text-[13px] text-[#5B584F] mb-5">We'll review it and follow up. Verified Expert badges are typically approved within a few business days.</p>
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-semibold bg-[#26364A] text-white hover:bg-[#1e2c3d] transition-colors">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(28,27,25,0.55)" }}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "#FDF1E5", border: "1px solid #F0C99B" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F0C99B" }}>
          <h2 className="text-[17px] font-semibold text-[#1C1B19]">Apply as a Verified Expert</h2>
          <button onClick={onClose} className="text-[#9A968A] hover:text-[#1C1B19]"><X size={18} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <p className="text-[13px] text-[#5B584F] -mt-1">
            Verified Experts get a credibility badge and limited rights to mention their practice on posts. Review is manual — keep it brief.
          </p>
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Your name</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="The name you post under" className={inputClass} />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Area of expertise</label>
            <select value={expertType} onChange={(e) => setExpertType(e.target.value)} className={inputClass}>
              {EXPERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Credential (license #, certifying body, or employer)</label>
            <input value={credentialInfo} onChange={(e) => setCredentialInfo(e.target.value)} placeholder="e.g. CA Bar #123456, or 'Speech-Language Pathologist, ABC School District'" className={inputClass} />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">
              Upload proof <span className="text-[#9A968A] font-normal">(license, certification, or ID — optional but speeds up review)</span>
            </label>
            <label className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#5B584F] cursor-pointer" style={{ border: "1px dashed #E3B37C", backgroundColor: "#FBF9F5" }}>
              <Upload size={15} />
              {fileName || "Choose a file"}
              <input type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} />
            </label>
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: "1px solid #F0C99B" }}>
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-medium text-[#5B584F] hover:text-[#1C1B19]">Cancel</button>
          <button disabled={!canSubmit}
            onClick={async () => {
              setSaving(true);
              await onSubmit({ author: author.trim(), expertType, credentialInfo: credentialInfo.trim(), fileName });
              setSaving(false);
              setDone(true);
            }}
            className="px-4 py-2 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-2 hover:bg-[#1e2c3d] transition-colors">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Submit application
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Nested comment thread                                                  */
/* ---------------------------------------------------------------------- */
function CommentNode({ comment, depth, allComments, voteDirs, onVote, onReply, badgesFor }) {
  const [replying, setReplying] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const children = allComments.filter((c) => c.parentId === comment.id).sort((a, b) => b.score - a.score);
  const cappedDepth = Math.min(depth, 5);

  const submitReply = async () => {
    if (!name.trim() || !text.trim()) return;
    setSending(true);
    await onReply(comment.postId, comment.id, { author: name.trim(), body: text.trim() });
    setSending(false);
    setText("");
    setReplying(false);
  };

  return (
    <div style={{ marginLeft: cappedDepth ? 20 : 0 }} className={cappedDepth ? "pl-4 border-l border-[#E6E3DA]" : ""}>
      <div className="mb-2">
        <div className="flex items-center gap-2 text-[13px] mb-0.5">
          <span className="font-semibold text-[#1C1B19]">{comment.author}</span>
          <AuthorBadges {...badgesFor(comment.author)} />
          <span className="text-[12px] text-[#9A968A]">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-[14px] text-[#3A382F] leading-relaxed mb-1.5">{comment.body}</p>
        <div className="flex items-center gap-4">
          <VoteControl vertical={false} score={comment.score} dir={voteDirs[comment.id] || 0} onVote={(d) => onVote(comment.id, d)} />
          <button onClick={() => setReplying((r) => !r)} className="text-[12px] font-medium text-[#9A968A] hover:text-[#26364A]">Reply</button>
        </div>
        {replying && (
          <div className="mt-2 mb-1">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
              className="w-full mb-2 px-3 py-2 border border-[#E6E3DA] bg-[#FAF9F7] text-[13px] outline-none focus:border-[#26364A]" />
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Write a reply..."
              className="w-full mb-2 px-3 py-2 border border-[#E6E3DA] bg-[#FAF9F7] text-[13px] outline-none focus:border-[#26364A] resize-none" />
            <div className="flex gap-2">
              <button disabled={!name.trim() || !text.trim() || sending} onClick={submitReply}
                className="px-3 py-1.5 text-[12px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-1.5">
                {sending && <Loader2 size={12} className="animate-spin" />} Reply
              </button>
              <button onClick={() => setReplying(false)} className="px-3 py-1.5 text-[12px] font-medium text-[#5B584F]">Cancel</button>
            </div>
          </div>
        )}
      </div>
      {children.map((child) => (
        <CommentNode key={child.id} comment={child} depth={depth + 1} allComments={allComments} voteDirs={voteDirs} onVote={onVote} onReply={onReply} badgesFor={badgesFor} />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Post detail                                                            */
/* ---------------------------------------------------------------------- */
function PostDetail({ post, comments, onBack, onVotePost, postDir, voteDirs, onVoteComment, onAddComment, onTopic, karma, badgesFor }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [commentSort, setCommentSort] = useState("best");

  const topLevel = comments.filter((c) => !c.parentId).sort((a, b) => (commentSort === "new" ? b.createdAt - a.createdAt : b.score - a.score));

  const submit = async () => {
    if (!name.trim() || !text.trim()) return;
    setSending(true);
    await onAddComment(post.id, null, { author: name.trim(), body: text.trim() });
    setText("");
    setSending(false);
  };

  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-1 text-[13px] font-medium text-[#5B584F] hover:text-[#1C1B19] mb-5">
        <ChevronLeft size={15} /> Back
      </button>

      <div className="mb-2">
        <TopicBadge topicId={post.topicId} onClick={() => onTopic(post.topicId)} />
      </div>
      <h1 className="text-[24px] font-semibold leading-tight text-[#1C1B19] mb-2">{post.title}</h1>
      <div className="text-[13px] text-[#9A968A] mb-4 flex items-center gap-1.5 flex-wrap">
        <span>{post.author}</span>
        <AuthorBadges {...badgesFor(post.author)} />
        <span className="text-[#26364A] font-medium">· {karma(post.author)} karma</span>
        {post.state && (
          <span className="flex items-center gap-0.5">· <MapPin size={12} className="ml-1" /> {post.state}</span>
        )}
        <span>· {timeAgo(post.createdAt)} ago</span>
        <span className="flex items-center gap-0.5">· <Eye size={12} className="ml-1" /> {post.views || 0} views</span>
      </div>
      <p className="text-[15px] text-[#3A382F] leading-relaxed mb-4 whitespace-pre-wrap">{post.body}</p>
      {post.promo && (
        <div className="flex items-center gap-2 text-[13px] text-[#217A78] bg-[#E4F2F1] px-3 py-2 mb-4">
          <Briefcase size={14} className="shrink-0" />
          <span>{post.promo.label}</span>
          {post.promo.url && (
            <a href={post.promo.url} target="_blank" rel="noreferrer" className="ml-auto font-medium underline shrink-0">Visit</a>
          )}
        </div>
      )}
      <div className="flex items-center gap-4 pb-6 mb-6 border-b border-[#E6E3DA]">
        <VoteControl vertical={false} score={post.score} dir={postDir} onVote={(d) => onVotePost(post.id, d)} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-[#1C1B19]">
          {comments.length} {comments.length === 1 ? "reply" : "replies"}
        </h2>
        <div className="flex gap-3 text-[12px]">
          {["best", "new"].map((s) => (
            <button key={s} onClick={() => setCommentSort(s)}
              className={`font-medium capitalize ${commentSort === s ? "text-[#26364A]" : "text-[#9A968A] hover:text-[#1C1B19]"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        {topLevel.map((c) => (
          <CommentNode key={c.id} comment={c} depth={0} allComments={comments} voteDirs={voteDirs} onVote={onVoteComment} onReply={onAddComment} badgesFor={badgesFor} />
        ))}
        {comments.length === 0 && <p className="text-[14px] text-[#9A968A] italic">No replies yet — be the first to weigh in.</p>}
      </div>

      <div className="border-t border-[#E6E3DA] pt-5">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
          className="w-full mb-2 px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A]" />
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Add your reply..."
          className="w-full mb-2 px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] resize-none" />
        <button disabled={!name.trim() || !text.trim() || sending} onClick={submit}
          className="px-4 py-2 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-2 hover:bg-[#1e2c3d] transition-colors">
          {sending && <Loader2 size={14} className="animate-spin" />} Reply
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Sidebar                                                                */
/* ---------------------------------------------------------------------- */
function Sidebar({ selectedTopic, onSelectTopic }) {
  const [openCat, setOpenCat] = useState(() => new Set(CATEGORIES.map((c) => c.id)));
  const toggle = (id) => setOpenCat((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <aside className="w-60 shrink-0 hidden md:flex flex-col max-h-[calc(100vh-140px)] overflow-y-auto pr-2">
      <button onClick={() => onSelectTopic(null)}
        className={`text-left px-2.5 py-2 text-[13px] font-semibold mb-3 border-l-2 ${!selectedTopic ? "border-[#26364A] text-[#1C1B19] bg-[#EFEDE6]" : "border-transparent text-[#5B584F] hover:text-[#1C1B19]"}`}>
        All Topics
      </button>
      {CATEGORIES.map((cat) => (
        <div key={cat.id} className="mb-1">
          <button onClick={() => toggle(cat.id)} className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-[#9A968A] tracking-wide">
            {cat.label}
            <ChevronDown size={12} className={`transition-transform ${openCat.has(cat.id) ? "" : "-rotate-90"}`} />
          </button>
          {openCat.has(cat.id) && (
            <div className="flex flex-col mb-2">
              {cat.topics.map((t) => (
                <TopicRow key={t.id} topic={t} categoryId={cat.id} active={selectedTopic === t.id} onClick={() => onSelectTopic(selectedTopic === t.id ? null : t.id)} />
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}

/* ---------------------------------------------------------------------- */
/*  Main app                                                               */
/* ---------------------------------------------------------------------- */
export default function RecessForum() {
  const [posts, setPosts] = useState(null);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sort, setSort] = useState("hot");
  const [topRange, setTopRange] = useState("week");
  const [query, setQuery] = useState("");
  const [selectedState, setSelectedState] = useState(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showExpertApp, setShowExpertApp] = useState(false);
  const [openPostId, setOpenPostId] = useState(null);
  const [postVoteDirs, setPostVoteDirs] = useState({});
  const [commentVoteDirs, setCommentVoteDirs] = useState({});
  const [viewedIds, setViewedIds] = useState(() => new Set());

  useEffect(() => {
    (async () => {
      try {
        let loadedPosts = SEED_POSTS;
        try {
          const r = await window.storage.get("recess:posts", true);
          if (r && r.value) loadedPosts = JSON.parse(r.value);
          else await window.storage.set("recess:posts", JSON.stringify(SEED_POSTS), true);
        } catch {}
        setPosts(loadedPosts);

        const commentsMap = {};
        for (const p of loadedPosts) {
          try {
            const r = await window.storage.get(`recess:comments:${p.id}`, true);
            commentsMap[p.id] = r && r.value ? JSON.parse(r.value) : (SEED_COMMENTS[p.id] || []);
            if (!r) await window.storage.set(`recess:comments:${p.id}`, JSON.stringify(commentsMap[p.id]), true).catch(() => {});
          } catch {
            commentsMap[p.id] = SEED_COMMENTS[p.id] || [];
          }
        }
        setComments(commentsMap);
      } catch {
        setError("Couldn't load the board. You can still browse locally.");
        setPosts(SEED_POSTS);
        setComments(SEED_COMMENTS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const savePosts = useCallback(async (next) => {
    setPosts(next);
    try { await window.storage.set("recess:posts", JSON.stringify(next), true); } catch {}
  }, []);

  const saveComments = useCallback(async (postId, list) => {
    setComments((c) => ({ ...c, [postId]: list }));
    try { await window.storage.set(`recess:comments:${postId}`, JSON.stringify(list), true); } catch {}
  }, []);

  const handleVotePost = useCallback((id, dir) => {
    const prevDir = postVoteDirs[id] || 0;
    const newDir = prevDir === dir ? 0 : dir;
    const delta = newDir - prevDir;
    setPostVoteDirs((s) => ({ ...s, [id]: newDir }));
    savePosts(posts.map((p) => (p.id === id ? { ...p, score: p.score + delta } : p)));
  }, [posts, postVoteDirs, savePosts]);

  const handleVoteComment = useCallback((id, dir) => {
    const prevDir = commentVoteDirs[id] || 0;
    const newDir = prevDir === dir ? 0 : dir;
    const delta = newDir - prevDir;
    setCommentVoteDirs((s) => ({ ...s, [id]: newDir }));
    const postId = Object.values(comments).flat().find((c) => c.id === id)?.postId;
    if (!postId) return;
    saveComments(postId, comments[postId].map((c) => (c.id === id ? { ...c, score: c.score + delta } : c)));
  }, [comments, commentVoteDirs, saveComments]);

  const handleNewPost = useCallback(async ({ title, body, author, topicId, state, promo }) => {
    const newPost = { id: `p-${Date.now()}`, title, body, author, topicId, state: state || null, promo: promo || null, score: 1, views: 0, createdAt: Date.now() };
    await savePosts([newPost, ...posts]);
    await saveComments(newPost.id, []);
    setPostVoteDirs((s) => ({ ...s, [newPost.id]: 1 }));
    setShowNewPost(false);
    setSelectedTopic(null);
  }, [posts, savePosts, saveComments]);

  const handleAddComment = useCallback(async (postId, parentId, { author, body }) => {
    const newComment = { id: `c-${Date.now()}`, postId, parentId, author, body, score: 1, createdAt: Date.now() };
    const list = [...(comments[postId] || []), newComment];
    await saveComments(postId, list);
    setCommentVoteDirs((s) => ({ ...s, [newComment.id]: 1 }));
  }, [comments, saveComments]);

  const karma = useCallback((author) => karmaFor(author, posts || [], comments), [posts, comments]);
  const badgesFor = useCallback((author) => ({ tier: tierFor(author, posts || [], comments), role: roleFor(author) }), [posts, comments]);

  const handleExpertApplication = useCallback(async (application) => {
    const record = { id: `app-${Date.now()}`, ...application, status: "pending", submittedAt: Date.now() };
    try {
      const r = await window.storage.get("recess:expertApplications", true);
      const list = r && r.value ? JSON.parse(r.value) : [];
      list.push(record);
      await window.storage.set("recess:expertApplications", JSON.stringify(list), true);
    } catch { /* best effort in prototype */ }
  }, []);

  useEffect(() => {
    if (!openPostId || !posts || viewedIds.has(openPostId)) return;
    setViewedIds((s) => new Set(s).add(openPostId));
    const next = posts.map((p) => (p.id === openPostId ? { ...p, views: (p.views || 0) + 1 } : p));
    savePosts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPostId, posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    const q = query.trim().toLowerCase();
    let list = posts.filter((p) => {
      if (selectedTopic && p.topicId !== selectedTopic) return false;
      if (!selectedTopic && selectedCategory && topicById(p.topicId)?.categoryId !== selectedCategory) return false;
      if (selectedState && p.state !== selectedState) return false;
      if (!q) return true;
      return `${p.title} ${p.body} ${topicLabel(p.topicId)} ${p.author}`.toLowerCase().includes(q);
    });
    if (sort === "top") {
      const cutoff = RANGE_MS[topRange] === Infinity ? -Infinity : Date.now() - RANGE_MS[topRange];
      list = list.filter((p) => p.createdAt >= cutoff).sort((a, b) => b.score - a.score);
    } else if (sort === "new") {
      list = [...list].sort((a, b) => b.createdAt - a.createdAt);
    } else {
      list = [...list].sort((a, b) => hotScore(b.score, b.views, b.createdAt) - hotScore(a.score, a.views, a.createdAt));
    }
    return list;
  }, [posts, selectedTopic, selectedCategory, selectedState, sort, topRange, query]);

  const openPost = posts?.find((p) => p.id === openPostId);
  const activeTopic = selectedTopic ? topicById(selectedTopic) : null;
  const activeCategory = selectedTopic ? categoryOf(selectedTopic) : null;
  const goTopic = (topicId) => { setSelectedTopic(topicId); setSelectedCategory(null); setOpenPostId(null); };
  const goCategory = (categoryId) => {
    setSelectedCategory((c) => (c === categoryId ? null : categoryId));
    setSelectedTopic(null);
    setOpenPostId(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-[#1C1B19]" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>

      <header className="border-b border-[#E6E3DA] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setSelectedTopic(null); setSelectedCategory(null); setOpenPostId(null); }}>
            <RecessMark size={30} />
            <div className="flex items-baseline gap-2.5">
              <span className="text-[19px] font-semibold tracking-tight text-[#1C1B19]">Recess Forum</span>
              <span className="text-[13px] text-[#9A968A] hidden sm:inline">for parents navigating school</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowExpertApp(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#5B584F] hover:text-[#217A78] transition-colors">
              <BadgeCheck size={15} /> Become a Verified Expert
            </button>
            <button onClick={() => setShowNewPost(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#26364A] text-white text-[13px] font-medium hover:bg-[#1e2c3d] transition-colors">
              <Plus size={15} /> New post
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-10">
        <Sidebar selectedTopic={selectedTopic} onSelectTopic={goTopic} />

        <main className="flex-1 min-w-0">
          {openPost ? (
            <PostDetail post={openPost} comments={comments[openPost.id] || []} onBack={() => setOpenPostId(null)}
              onVotePost={handleVotePost} postDir={postVoteDirs[openPost.id] || 0} voteDirs={commentVoteDirs}
              onVoteComment={handleVoteComment} onAddComment={handleAddComment} onTopic={goTopic} karma={karma} badgesFor={badgesFor} />
          ) : (
            <>
              {activeTopic && (
                <div className="mb-6 pb-5 border-b border-[#E6E3DA] border-l-4 pl-4" style={{ borderLeftColor: colorForCategory(activeCategory.id).solid }}>
                  <div className="text-[12px] font-medium mb-1" style={{ color: colorForCategory(activeCategory.id).text }}>{activeCategory?.label}</div>
                  <div className="text-[20px] font-semibold text-[#1C1B19]">{activeTopic.label}</div>
                  <div className="text-[13px] text-[#5B584F] mt-0.5">{activeTopic.blurb}</div>
                </div>
              )}
              {!activeTopic && selectedCategory && (
                <div className="mb-6 pb-5 border-b border-[#E6E3DA] border-l-4 pl-4" style={{ borderLeftColor: colorForCategory(selectedCategory).solid }}>
                  <div className="text-[20px] font-semibold text-[#1C1B19]">{CATEGORIES.find((c) => c.id === selectedCategory)?.label}</div>
                  <div className="text-[13px] text-[#5B584F] mt-0.5">All topics in this category</div>
                </div>
              )}

              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A968A]" />
                <input value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search posts by topic, keyword, or interest..."
                  className="w-full pl-9 pr-3 py-2.5 border border-[#E6E3DA] bg-white text-[14px] outline-none focus:border-[#26364A] transition-colors" />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mb-5">
                {CATEGORIES.map((c) => {
                  const col = colorForCategory(c.id);
                  const active = selectedCategory === c.id;
                  return (
                    <button key={c.id} onClick={() => goCategory(c.id)}
                      style={{ backgroundColor: active ? col.solid : col.bg, color: active ? "#FFFFFF" : col.text }}
                      className="text-[12px] font-medium px-2.5 py-1 rounded-sm transition-colors">
                      {c.label}
                    </button>
                  );
                })}
                <div className="relative ml-auto">
                  <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9A968A] pointer-events-none" />
                  <select value={selectedState || ""} onChange={(e) => setSelectedState(e.target.value || null)}
                    className="pl-7 pr-2 py-1.5 text-[12px] border border-[#E6E3DA] bg-white outline-none appearance-none">
                    <option value="">All states</option>
                    {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <div className="flex items-center gap-4 text-[13px]">
                  {[
                    { id: "hot", icon: Flame, label: "Hot" },
                    { id: "new", icon: Clock, label: "New" },
                    { id: "top", icon: Trophy, label: "Top" },
                  ].map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setSort(id)}
                      className={`flex items-center gap-1.5 pb-2 border-b-2 transition-colors ${sort === id ? "border-[#26364A] text-[#1C1B19] font-medium" : "border-transparent text-[#9A968A] hover:text-[#1C1B19]"}`}>
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                  {sort === "top" && (
                    <select value={topRange} onChange={(e) => setTopRange(e.target.value)}
                      className="text-[12px] border border-[#E6E3DA] bg-white px-2 py-1 outline-none">
                      <option value="day">Today</option>
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                      <option value="all">All time</option>
                    </select>
                  )}
                </div>
                <span className="text-[12px] text-[#9A968A]">{filteredPosts.length} posts</span>
              </div>

              {error && <p className="text-[13px] text-[#26364A] mt-3">{error}</p>}

              {loading ? (
                <div className="flex items-center gap-2 text-[#9A968A] text-[14px] py-12 justify-center">
                  <Loader2 size={16} className="animate-spin" /> Loading...
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-16 text-[#9A968A]">
                  <p className="text-[16px] font-semibold text-[#1C1B19] mb-1">Nothing here yet</p>
                  <p className="text-[14px]">{query ? "No posts match your search." : "Be the first to post in this category."}</p>
                </div>
              ) : (
                <div>
                  {filteredPosts.map((p) => (
                    <PostRow key={p.id} post={p} commentCount={(comments[p.id] || []).length}
                      onOpen={setOpenPostId} onVote={handleVotePost} dir={postVoteDirs[p.id] || 0} onTopic={goTopic} badgesFor={badgesFor} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {showNewPost && <NewPostModal defaultTopic={selectedTopic} onClose={() => setShowNewPost(false)} onSubmit={handleNewPost} />}
      {showExpertApp && <ExpertApplicationModal onClose={() => setShowExpertApp(false)} onSubmit={handleExpertApplication} />}
    </div>
  );
}
