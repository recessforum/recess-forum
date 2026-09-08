"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { timeAgo } from "@/lib/ranking";
import type { ExpertApplication } from "@/lib/types";

type Application = ExpertApplication & { applicantName: string };

export default function AdminPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!profile || profile.role !== "admin") { setLoading(false); return; }
      try {
        const res = await fetch("/api/admin/expert-applications");
        if (!res.ok) throw new Error((await res.json()).error || "failed to load");
        const data = await res.json();
        setApplications(data.applications);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't load applications.");
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  const review = async (id: string, decision: "approve" | "reject") => {
    setWorkingId(id);
    const res = await fetch(`/api/admin/expert-applications/${id}/${decision}`, { method: "POST" });
    if (res.ok) {
      setApplications((apps) => apps?.map((a) =>
        a.id === id ? { ...a, status: decision === "approve" ? "approved" : "rejected" } : a
      ) ?? null);
    }
    setWorkingId(null);
  };

  if (authLoading || (profile && loading)) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 flex items-center justify-center gap-2 text-[#9A968A] text-[14px]">
        <Loader2 size={16} className="animate-spin" /> Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1C1B19] mb-2">Admins only</p>
        <button onClick={() => router.push("/login")} className="text-[14px] font-medium text-[#26364A] hover:underline">Log in</button>
      </div>
    );
  }

  if (profile.role !== "admin") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1C1B19] mb-2">Admins only</p>
        <p className="text-[14px] text-[#5B584F]">You&apos;re signed in as {profile.display_name}, which isn&apos;t an admin account.</p>
      </div>
    );
  }

  const pending = (applications || []).filter((a) => a.status === "pending");
  const reviewed = (applications || []).filter((a) => a.status !== "pending");

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 w-full">
      <h1 className="text-[22px] font-semibold text-[#1C1B19] mb-1">Verified Expert applications</h1>
      <p className="text-[13px] text-[#9A968A] mb-6">Approving grants the applicant the Verified Expert badge and business-mention perk.</p>

      {error && <p className="text-[13px] text-[#B23B3B] mb-4">{error}</p>}

      <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-2">Pending ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="text-[14px] text-[#9A968A] italic mb-8">Nothing waiting on review.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {pending.map((app) => (
            <div key={app.id} className="border border-[#E6E3DA] bg-white p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[14px] font-semibold text-[#1C1B19]">{app.applicantName}</span>
                <span className="text-[12px] text-[#9A968A]">{timeAgo(app.submittedAt)} ago</span>
              </div>
              <p className="text-[13px] text-[#217A78] font-medium mb-1">{app.expertType}</p>
              <p className="text-[13px] text-[#5B584F] mb-1">{app.credentialInfo}</p>
              {app.filePath && (
                <a href={`/api/admin/expert-applications/${app.id}/file`} target="_blank" rel="noopener noreferrer"
                  className="text-[12px] text-[#26364A] underline mb-3 inline-block">
                  View attachment
                </a>
              )}
              <div className="flex gap-2 mt-3">
                <button disabled={workingId === app.id} onClick={() => review(app.id, "approve")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold bg-[#217A78] text-white disabled:opacity-40 hover:bg-[#1a615f] transition-colors">
                  {workingId === app.id ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={13} />} Approve
                </button>
                <button disabled={workingId === app.id} onClick={() => review(app.id, "reject")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#5B584F] border border-[#E6E3DA] disabled:opacity-40 hover:text-[#B23B3B] hover:border-[#B23B3B] transition-colors">
                  <X size={13} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <>
          <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-2">Reviewed</h2>
          <div className="flex flex-col gap-2">
            {reviewed.map((app) => (
              <div key={app.id} className="flex items-center justify-between text-[13px] text-[#5B584F] py-2 border-b border-[#E6E3DA]">
                <span>{app.applicantName} — {app.expertType}</span>
                <span className={app.status === "approved" ? "text-[#217A78] font-medium" : "text-[#9A968A]"}>{app.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
