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
