export function hotScore(score: number, views: number, createdAt: number): number {
  const ageHours = (Date.now() - createdAt) / 1000 / 60 / 60;
  const voteOrder = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const viewOrder = Math.log10((views || 0) + 1) * 0.4; // views count, but weighted less than votes
  return sign * voteOrder + viewOrder - ageHours / 12;
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export const RANGE_MS: Record<string, number> = { day: 864e5, week: 6048e5, month: 2592e6, all: Infinity };

export function rangeCutoff(range: string): number {
  const ms = RANGE_MS[range];
  return ms === Infinity ? -Infinity : Date.now() - ms;
}

const hasMedia = (p: { imageUrl: string | null; videoUrl: string | null }) => !!(p.imageUrl || p.videoUrl);

// Small seeded PRNG so one visit keeps the same order (votes re-sort the list)
// while each new visit rotates which photo/video posts get the top slots.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Keeps photo/video posts visible in an otherwise text-heavy feed:
 * `top` media posts (picked at random per `seed`, so they rotate) go first,
 * and the remaining media posts are spread evenly through the rest of the
 * list. Each group keeps its incoming order (hot/new).
 */
export function featureMedia<T extends { imageUrl: string | null; videoUrl: string | null }>(
  list: T[], seed: number, top = 3,
): T[] {
  const media = list.filter(hasMedia);
  if (media.length === 0) return list;
  const rand = mulberry32(seed);
  const picked = new Set<T>();
  const pool = [...media];
  while (picked.size < Math.min(top, media.length)) {
    picked.add(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  const head = media.filter((p) => picked.has(p)); // keep feed order within the top slots
  const restMedia = media.filter((p) => !picked.has(p));
  const text = list.filter((p) => !hasMedia(p));

  // Even spread: the k-th remaining media post lands at slot (k+1)·total/(n+1),
  // so n media posts split the text posts into n+1 roughly equal runs.
  const total = restMedia.length + text.length;
  const slots = new Set(restMedia.map((_, k) => Math.floor(((k + 1) * total) / (restMedia.length + 1))));
  const out: T[] = [...head];
  let m = 0, t = 0;
  for (let i = 0; i < total; i++) {
    const useMedia = m < restMedia.length && (slots.has(i) || t >= text.length);
    out.push(useMedia ? restMedia[m++] : text[t++]);
  }
  return out;
}
