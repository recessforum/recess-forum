"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { eventStatus, formatEventTime, type OfficeHoursEvent } from "@/lib/events";

export default function EventsPage() {
  const [events, setEvents] = useState<OfficeHoursEvent[] | null>(null);
  useEffect(() => { fetch("/api/events").then((r) => r.json()).then((d) => setEvents(d.events ?? [])); }, []);
  const upcoming = (events ?? []).filter((e) => eventStatus(e) !== "ended");
  const past = (events ?? []).filter((e) => eventStatus(e) === "ended").reverse();

  const Row = ({ e }: { e: OfficeHoursEvent }) => {
    const st = eventStatus(e);
    return (
      <Link href={`/post/${e.postId}`} className="block p-4 border border-[#E6E3DA] bg-white hover:border-[#26364A] transition-colors">
        <p className={`text-[12px] font-bold uppercase tracking-wide mb-1 ${st === "live" ? "text-[#9C3B4A]" : "text-[#217A78]"}`}>
          {st === "live" ? "Live now" : formatEventTime(e.startsAt)}
        </p>
        <p className="text-[16px] font-semibold text-[#1C1B19]">{e.title}</p>
        {e.hostName && <p className="text-[13px] text-[#5B584F] mt-0.5">with {e.hostName}{e.hostExpertType ? `, ${e.hostExpertType}` : ""}</p>}
        {e.description && <p className="text-[13px] text-[#5B584F] mt-2 line-clamp-2">{e.description}</p>}
      </Link>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 w-full">
      <h1 className="text-[26px] font-semibold text-[#1C1B19] mb-2">Office Hours</h1>
      <p className="text-[14px] text-[#5B584F] mb-8">
        Scheduled sessions where Verified Experts answer parents&apos; questions. Post your question in the thread any time before it starts.
      </p>
      {events === null ? (
        <p className="text-[14px] text-[#9A968A] flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Loading...</p>
      ) : (
        <>
          <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-3">Coming up</h2>
          <div className="flex flex-col gap-3 mb-10">
            {upcoming.length ? upcoming.map((e) => <Row key={e.id} e={e} />) : <p className="text-[14px] text-[#9A968A] italic">Nothing scheduled right now. Check back soon.</p>}
          </div>
          {past.length > 0 && (
            <>
              <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-3">Recent (answers stay up)</h2>
              <div className="flex flex-col gap-3">{past.map((e) => <Row key={e.id} e={e} />)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
