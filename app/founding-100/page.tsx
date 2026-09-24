import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getFoundingStatus } from "@/lib/founding";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Founding 100" };
export const revalidate = 0;

export default async function Founding100Page() {
  const supabase = await createClient();
  const status = await getFoundingStatus(supabase);
  const pctFilled = Math.round((status.filled / status.cap) * 100);
  const full = status.spotsLeft === 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2 py-1 rounded-sm bg-[#F5EFDD] text-[#B08D45] mb-4">
        <Sparkles size={12} /> Founding 100
      </div>

      <h1 className="text-[26px] font-semibold text-[#1C1B19] mb-3 leading-snug">
        The first 100 parents on Recess Forum
      </h1>
      <p className="text-[14px] text-[#5B584F] leading-relaxed mb-8">
        Every community starts with the people who show up first. The first 100 parents to
        join Recess Forum get a permanent Founding Parent badge on their profile — a mark
        that they were here from the start, asking the questions and giving the answers
        that shaped what this place became.
      </p>

      <div className="mb-8">
        <div className="flex items-center justify-between text-[13px] font-medium text-[#5B584F] mb-2">
          <span>{status.filled} of {status.cap} spots taken</span>
          <span>{full ? "Full" : `${status.spotsLeft} left`}</span>
        </div>
        <div className="h-2 rounded-full bg-[#E6E3DA] overflow-hidden">
          <div className="h-full bg-[#B08D45] rounded-full transition-all" style={{ width: `${pctFilled}%` }} />
        </div>
      </div>

      {full ? (
        <p className="text-[14px] text-[#9A968A] italic mb-8">
          All 100 founding spots have been claimed. Thank you to everyone who joined early —
          the community is just getting started.
        </p>
      ) : (
        <Link href="/signup"
          className="inline-block text-[14px] font-semibold text-white bg-[#26364A] px-5 py-2.5 rounded-md hover:bg-[#1C2836] mb-8">
          Claim your spot
        </Link>
      )}

      <div className="border-t border-[#E6E3DA] pt-6">
        <h2 className="text-[15px] font-semibold text-[#1C1B19] mb-2">What Founding Parents get</h2>
        <ul className="text-[13px] text-[#5B584F] leading-relaxed list-disc pl-5 flex flex-col gap-1.5">
          <li>A permanent Founding Parent badge on their profile</li>
          <li>First say in what topics, circles, and features come next</li>
          <li>A direct line — we read and respond to founding members&apos; feedback ourselves</li>
        </ul>
      </div>
    </div>
  );
}
