/** Office Hours: a scheduled window when a Verified Expert answers questions in one thread. */
export interface OfficeHoursEvent {
  id: string;
  postId: string;
  title: string;
  description: string | null;
  startsAt: number;
  endsAt: number;
  hostId: string | null;
  hostName: string | null;
  hostExpertType: string | null;
}

export type EventStatus = "upcoming" | "live" | "ended";
export const eventStatus = (e: OfficeHoursEvent, now = Date.now()): EventStatus =>
  now < e.startsAt ? "upcoming" : now < e.endsAt ? "live" : "ended";

/** "Thu, Oct 2 · 8:00 PM PDT" in the viewer's own time zone. */
export function formatEventTime(ms: number) {
  return new Date(ms).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });
}

export const EVENT_SELECT = "id, post_id, title, description, starts_at, ends_at, host_id, profiles!events_host_id_fkey(display_name, expert_type)";

type Row = {
  id: string; post_id: string; title: string; description: string | null; starts_at: string; ends_at: string; host_id: string | null;
  profiles: { display_name: string; expert_type: string | null } | { display_name: string; expert_type: string | null }[] | null;
};
export function toEvent(r: Row): OfficeHoursEvent {
  const host = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
  return {
    id: r.id, postId: r.post_id, title: r.title, description: r.description,
    startsAt: new Date(r.starts_at).getTime(), endsAt: new Date(r.ends_at).getTime(),
    hostId: r.host_id, hostName: host?.display_name ?? null, hostExpertType: host?.expert_type ?? null,
  };
}
