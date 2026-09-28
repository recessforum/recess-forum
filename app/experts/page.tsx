"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Loader2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";

interface Expert { id: string; displayName: string; avatarUrl: string | null; expertType: string | null; bio: string | null }

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[] | null>(null);
  useEffect(() => { fetch("/api/experts").then((r) => r.json()).then((d) => setExperts(d.experts ?? [])); }, []);
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 w-full">
      <h1 className="text-[26px] font-semibold text-[#1C1B19] mb-2">Verified Experts</h1>
      <p className="text-[14px] text-[#5B584F] mb-8 max-w-2xl">
        Educators, counselors, therapists, and advocates who answer parents&apos; questions on Recess Forum. We review each
        expert&apos;s credentials before they get the badge.
      </p>
      {experts === null ? (
        <p className="text-[14px] text-[#9A968A] flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Loading...</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {experts.map((e) => (
            <Link key={e.id} href={`/u/${e.id}`} className="flex items-start gap-3 p-4 border border-[#E6E3DA] bg-white hover:border-[#217A78] transition-colors">
              <Avatar url={e.avatarUrl} name={e.displayName} size={44} />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-[#1C1B19]">{e.displayName}</p>
                <p className="text-[12px] font-medium text-[#217A78] flex items-center gap-1 mb-1"><BadgeCheck size={12} /> {e.expertType || "Verified Expert"}</p>
                {e.bio && <p className="text-[13px] text-[#5B584F] line-clamp-2">{e.bio}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-10 p-6 bg-[#F5EFDD] border border-[#E6D6AE]">
        <h2 className="text-[16px] font-semibold text-[#1C1B19] mb-1">Are you a professional who works with families?</h2>
        <p className="text-[14px] text-[#5B584F] mb-4">Join free as a Verified Expert. Answer when you have time, and parents can find your practice.</p>
        <Link href="/signup" className="inline-block text-[14px] font-semibold text-white bg-[#26364A] px-5 py-2.5 hover:bg-[#1C2836]">Apply to be a Verified Expert</Link>
      </div>
    </div>
  );
}
