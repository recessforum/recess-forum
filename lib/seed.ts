import type { Comment, Post } from "./types";

const now = Date.now();

export const SEED_POSTS: Post[] = [
  { id: "seed-1", title: "How do you handle homework battles on school nights?",
    body: "My 9-year-old melts down over math worksheets every single night. Looking for what's actually worked for other parents — routines, rewards, anything.",
    author: "MiraP", topicId: "math-help", state: "TX", promo: null, score: 14, views: 128, createdAt: now - 1000 * 60 * 60 * 5 },
  { id: "seed-2", title: "Switched to homeschooling mid-year — ask me anything",
    body: "We pulled our daughter out of 7th grade in October. It's been a big adjustment but a good one so far. Happy to share what curriculum we landed on.",
    author: "DKimFamily", topicId: "homeschool", state: "CA", promo: null, score: 31, views: 340, createdAt: now - 1000 * 60 * 60 * 30 },
  { id: "seed-3", title: "Tutoring burnout is real — how many hours is too many?",
    body: "Our son does 6 hours/week of tutoring on top of a full school day and travel soccer. He seems fine but I keep wondering if we're overdoing it.",
    author: "growth_dad", topicId: "tutoring", state: "IL", promo: null, score: 9, views: 64, createdAt: now - 1000 * 60 * 60 * 2 },
  { id: "seed-4", title: "504 plan got denied — anyone successfully appeal?",
    body: "School said his diagnosis didn't 'impact learning enough.' Feels like a wall. Has anyone pushed back and won?",
    author: "quietstormom", topicId: "special-ed", state: "OH", promo: null, score: 22, views: 201, createdAt: now - 1000 * 60 * 60 * 14 },
  { id: "seed-5", title: "How many APs is actually 'enough' for competitive admissions?",
    body: "Junior year and I keep hearing conflicting advice — some say 5+ APs, others say depth over breadth matters more. What actually moved the needle for your kid's applications?",
    author: "collegecountdown", topicId: "college-applications", state: "NY", promo: null, score: 41, views: 512, createdAt: now - 1000 * 60 * 60 * 8 },
  { id: "seed-6", title: "Best rainy-day activities that aren't screens?",
    body: "We've done every craft on Pinterest at this point. Looking for fresh ideas for a 7 and 9 year old that don't end in a screen or a meltdown.",
    author: "puddlejumper", topicId: "screen-free-fun", state: "WA", promo: null, score: 19, views: 156, createdAt: now - 1000 * 60 * 60 * 6 },
  { id: "seed-7", title: "Family road trip tips for a first-timer with 3 kids under 10?",
    body: "Doing a 6-hour drive this summer for the first time with all three. Snacks, entertainment, timing — tell me everything that's worked for you.",
    author: "vanlife_mama", topicId: "travel-with-kids", state: "CO", promo: null, score: 27, views: 203, createdAt: now - 1000 * 60 * 60 * 20 },
];

export const SEED_COMMENTS: Record<string, Comment[]> = {
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
