"use client";

import Link from "next/link";
import { CalendarClock, Radio } from "lucide-react";
import { eventStatus, formatEventTime, type OfficeHoursEvent } from "@/lib/events";

/** Office Hours banner: "Live now" or "Starts …", linking to the Q&A thread unless already on it. */
export function EventBanner({ event, onThread = false }: { event: OfficeHoursEvent; onThread?: boolean }) {
  const status = eventStatus(event);
  if (status === "ended" && !onThread) return null;
  const live = status === "live";
  const host = event.hostName ? ` with ${event.hostName}${event.hostExpertType ? `, ${event.hostExpertType}` : ""}` : "";
  const body = (
    <div className={`flex items-start gap-3 p-4 border ${live ? "border-[#E8C3CA] bg-[#FBF1F1]" : "border-[#BFE0DE] bg-[#F3FAF9]"}`}>
      {live ? <Radio size={18} className="text-[#9C3B4A] shrink-0 mt-0.5" /> : <CalendarClock size={18} className="text-[#217A78] shrink-0 mt-0.5" />}
      <div className="min-w-0">
        <p className={`text-[12px] font-bold uppercase tracking-wide ${live ? "text-[#9C3B4A]" : "text-[#217A78]"}`}>
          {live ? "Office Hours · live now" : status === "ended" ? "Office Hours · ended" : "Office Hours"}
        </p>
        <p className="text-[15px] font-semibold text-[#1C1B19] leading-snug">{event.title}{host}</p>
        <p className="text-[13px] text-[#5B584F] mt-0.5">
          {status === "ended" ? `Held ${formatEventTime(event.startsAt)}. The answers stay here.`
            : live ? `Until ${new Date(event.endsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}. ${onThread ? "Ask your question in a reply below." : "Jump in and ask."}`
            : `${formatEventTime(event.startsAt)}. ${onThread ? "Post your question below now and it'll be answered during the session." : "Add your question now."}`}
        </p>
      </div>
    </div>
  );
  return onThread ? body : <Link href={`/post/${event.postId}`} className="block mb-4 hover:opacity-90">{body}</Link>;
}
