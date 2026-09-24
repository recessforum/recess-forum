"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Copy, Download, Flag, Loader2, RefreshCw, ShieldOff, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { timeAgo } from "@/lib/ranking";
import { topicLabel } from "@/lib/taxonomy";
import type { AdminBlockRecord, AdminStats, ExpertApplication, Report } from "@/lib/types";
import type { CardNewsContent } from "@/lib/cardNews";

type Application = ExpertApplication & { applicantName: string };

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[#E6E3DA] bg-white px-4 py-3">
      <p className="text-[20px] font-semibold text-[#1C1B19] leading-tight">{value.toLocaleString()}</p>
      <p className="text-[12px] text-[#9A968A] mt-0.5">{label}</p>
    </div>
  );
}

function RankedBars({ rows, max }: { rows: { label: string; count: number }[]; max: number }) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="text-[12px] text-[#5B584F] w-28 shrink-0 truncate">{row.label}</span>
          <div className="flex-1 h-5 bg-[#F0EEE8] relative">
            <div className="h-full bg-[#B08D45]" style={{ width: `${max ? (row.count / max) * 100 : 0}%` }} />
          </div>
          <span className="text-[12px] text-[#9A968A] w-8 text-right shrink-0">{row.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const [card, setCard] = useState<CardNewsContent | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [seenPostIds, setSeenPostIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [blocks, setBlocks] = useState<AdminBlockRecord[] | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!profile || profile.role !== "admin") { setLoading(false); return; }
      try {
        const [appsRes, reportsRes, statsRes] = await Promise.all([
          fetch("/api/admin/expert-applications"),
          fetch("/api/admin/reports"),
          fetch("/api/admin/stats"),
        ]);
        if (!appsRes.ok) throw new Error((await appsRes.json()).error || "failed to load");
        if (!reportsRes.ok) throw new Error((await reportsRes.json()).error || "failed to load");
        setApplications((await appsRes.json()).applications);
        setReports((await reportsRes.json()).reports);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
          setBlocks(data.blocks);
        } else {
          setStatsError((await statsRes.json()).error || "Couldn't load stats.");
        }
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

  const resolveReport = async (id: string, decision: "resolve" | "dismiss") => {
    setWorkingId(id);
    const res = await fetch(`/api/admin/reports/${id}/${decision}`, { method: "POST" });
    if (res.ok) {
      setReports((rs) => rs?.map((r) =>
        r.id === id ? { ...r, status: decision === "resolve" ? "reviewed" : "dismissed" } : r
      ) ?? null);
    }
    setWorkingId(null);
  };

  const makeCard = async (excludeCurrent: boolean) => {
    setCardLoading(true);
    setCardError(null);
    const exclude = excludeCurrent && card ? [...seenPostIds, card.postId] : seenPostIds;
    const res = await fetch(`/api/admin/card-news/pick?exclude=${exclude.join(",")}`);
    const data = await res.json();
    if (!res.ok) {
      setCardError(data.error || "Couldn't pick a post.");
      setCardLoading(false);
      return;
    }
    if (excludeCurrent && card) setSeenPostIds((ids) => [...ids, card.postId]);
    setCard(data.content);
    setCopied(false);
    setCardLoading(false);
  };

  const copyCaption = async () => {
    if (!card) return;
    await navigator.clipboard.writeText(card.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
  const pendingReports = (reports || []).filter((r) => r.status === "pending");
  const resolvedReports = (reports || []).filter((r) => r.status !== "pending");

  const stateRows = (stats?.usersByState || []).slice(0, 8).map((r) => ({ label: r.state, count: r.count }));
  const topicRows = (stats?.postsByTopic || []).slice(0, 8).map((r) => ({ label: topicLabel(r.topicId), count: r.count }));
  const stateMax = Math.max(1, ...stateRows.map((r) => r.count));
  const topicMax = Math.max(1, ...topicRows.map((r) => r.count));

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 w-full">
      <h1 className="text-[22px] font-semibold text-[#1C1B19] mb-4">Overview</h1>

      {statsError && <p className="text-[13px] text-[#B23B3B] mb-4">{statsError}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
            <StatTile label="Total members" value={stats.totalUsers} />
            <StatTile label="New today" value={stats.newUsersToday} />
            <StatTile label="New this week" value={stats.newUsersThisWeek} />
            <StatTile label="Total posts" value={stats.totalPosts} />
            <StatTile label="New posts today" value={stats.newPostsToday} />
            <StatTile label="New posts this week" value={stats.newPostsThisWeek} />
            <StatTile label="Total replies" value={stats.totalComments} />
            <StatTile label="New replies today" value={stats.newCommentsToday} />
            <StatTile label="New replies this week" value={stats.newCommentsThisWeek} />
            <StatTile label="Pending reports" value={stats.pendingReports} />
            <StatTile label="Pending expert apps" value={stats.pendingExpertApplications} />
          </div>

          <div className="grid sm:grid-cols-2 gap-8 mb-10">
            <div>
              <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-1">Members by state</h2>
              <p className="text-[11px] text-[#9A968A] mb-3">
                We don&apos;t track login location or IP, so this is self-reported state at signup — the closest honest proxy for where members are.
              </p>
              {stateRows.length === 0 ? (
                <p className="text-[13px] text-[#9A968A] italic">No state data yet.</p>
              ) : (
                <RankedBars rows={stateRows} max={stateMax} />
              )}
            </div>
            <div>
              <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-1">Posts by topic</h2>
              <p className="text-[11px] text-[#9A968A] mb-3">Top topics by total post count.</p>
              {topicRows.length === 0 ? (
                <p className="text-[13px] text-[#9A968A] italic">No posts yet.</p>
              ) : (
                <RankedBars rows={topicRows} max={topicMax} />
              )}
            </div>
          </div>
        </>
      )}

      {blocks && (
        <>
          <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-1 mt-2">
            Blocked users ({blocks.length})
          </h2>
          <p className="text-[11px] text-[#9A968A] mb-3">
            Member-to-member blocks (not admin bans) — a member appearing often as &quot;blocked&quot; may be worth a closer look.
          </p>
          {blocks.length === 0 ? (
            <p className="text-[13px] text-[#9A968A] italic mb-10">No one has blocked anyone yet.</p>
          ) : (
            <div className="flex flex-col gap-2 mb-10">
              {blocks.map((b) => (
                <div key={`${b.blockerId}-${b.blockedId}`} className="flex items-center justify-between text-[13px] text-[#5B584F] py-2 border-b border-[#E6E3DA]">
                  <span className="flex items-center gap-1.5">
                    <ShieldOff size={13} className="text-[#9A968A]" />
                    <b className="text-[#1C1B19] font-medium">{b.blockerName}</b> blocked <b className="text-[#1C1B19] font-medium">{b.blockedName}</b>
                  </span>
                  <span className="text-[12px] text-[#9A968A]">{timeAgo(b.createdAt)} ago</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <h1 className="text-[22px] font-semibold text-[#1C1B19] mb-1">Today&apos;s card news</h1>
      <p className="text-[13px] text-[#9A968A] mb-4">
        Picks a real post + reply from the live site and builds a 1080×1350 Instagram card. Nothing here is invented — the image and caption are built straight from the real title, reply, author, and scores.
      </p>
      <div className="border border-[#E6E3DA] bg-white p-4 mb-10">
        {!card && !cardLoading && (
          <button onClick={() => makeCard(false)}
            className="px-4 py-2.5 text-[14px] font-semibold bg-[#26364A] text-white hover:bg-[#1e2c3d] transition-colors">
            Make today&apos;s card
          </button>
        )}
        {cardLoading && (
          <div className="flex items-center gap-2 text-[14px] text-[#9A968A] py-4">
            <Loader2 size={16} className="animate-spin" /> Picking a real post and rendering the card...
          </div>
        )}
        {cardError && <p className="text-[13px] text-[#B23B3B] mb-2">{cardError}</p>}
        {card && !cardLoading && (
          <div className="flex flex-col sm:flex-row gap-4">
            <img src={`/api/admin/card-news/image?postId=${card.postId}`} alt="Card news preview"
              className="w-full sm:w-56 shrink-0 border border-[#E6E3DA]" />
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <p className="text-[12px] text-[#9A968A]">{card.hasReply ? "Has a real reply" : "No replies yet — framed as an invitation to answer"}</p>
              <textarea readOnly value={card.caption} rows={8}
                className="w-full px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[13px] leading-relaxed outline-none resize-none" />
              <div className="flex flex-wrap gap-2">
                <button onClick={copyCaption}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#5B584F] border border-[#E6E3DA] hover:text-[#1C1B19] transition-colors">
                  <Copy size={13} /> {copied ? "Copied!" : "Copy caption"}
                </button>
                <a href={`/api/admin/card-news/image?postId=${card.postId}`} download={`recess-forum-card-${card.postId}.png`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#5B584F] border border-[#E6E3DA] hover:text-[#1C1B19] transition-colors">
                  <Download size={13} /> Download image
                </a>
                <button disabled={cardLoading} onClick={() => makeCard(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#5B584F] border border-[#E6E3DA] hover:text-[#1C1B19] transition-colors">
                  <RefreshCw size={13} /> Try another post
                </button>
              </div>
              <p className="text-[11px] text-[#9A968A]">Posting to Instagram is still a manual step — download the image, copy the caption, and post it yourself (or ask Claude to post it for you).</p>
            </div>
          </div>
        )}
      </div>

      <h2 className="text-[15px] font-semibold text-[#1C1B19] mb-1 mt-2">Verified Expert applications</h2>
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
          <div className="flex flex-col gap-2 mb-8">
            {reviewed.map((app) => (
              <div key={app.id} className="flex items-center justify-between text-[13px] text-[#5B584F] py-2 border-b border-[#E6E3DA]">
                <span>{app.applicantName} — {app.expertType}</span>
                <span className={app.status === "approved" ? "text-[#217A78] font-medium" : "text-[#9A968A]"}>{app.status}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-2 mt-4">Reports — Pending ({pendingReports.length})</h2>
      {pendingReports.length === 0 ? (
        <p className="text-[14px] text-[#9A968A] italic mb-8">Nothing waiting on review.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {pendingReports.map((r) => (
            <div key={r.id} className="border border-[#E6E3DA] bg-white p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1C1B19]">
                  <Flag size={13} className="text-[#B23B3B]" /> {r.targetType} reported
                </span>
                <span className="text-[12px] text-[#9A968A]">{timeAgo(r.createdAt)} ago</span>
              </div>
              <p className="text-[13px] text-[#5B584F] mb-1">Reason: {r.reason}</p>
              <p className="text-[12px] text-[#9A968A] mb-1">Reported by {r.reporterName}</p>
              {r.targetType === "post" && (
                <a href={`/post/${r.targetId}`} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#26364A] underline mb-3 inline-block">
                  View post
                </a>
              )}
              {r.targetType === "user" && (
                <a href={`/u/${r.targetId}`} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#26364A] underline mb-3 inline-block">
                  View profile
                </a>
              )}
              <div className="flex gap-2 mt-3">
                <button disabled={workingId === r.id} onClick={() => resolveReport(r.id, "resolve")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold bg-[#217A78] text-white disabled:opacity-40 hover:bg-[#1a615f] transition-colors">
                  {workingId === r.id ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={13} />} Mark reviewed
                </button>
                <button disabled={workingId === r.id} onClick={() => resolveReport(r.id, "dismiss")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#5B584F] border border-[#E6E3DA] disabled:opacity-40 hover:text-[#B23B3B] hover:border-[#B23B3B] transition-colors">
                  <X size={13} /> Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolvedReports.length > 0 && (
        <>
          <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-2">Reports — Resolved</h2>
          <div className="flex flex-col gap-2">
            {resolvedReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-[13px] text-[#5B584F] py-2 border-b border-[#E6E3DA]">
                <span>{r.targetType} — {r.reason}</span>
                <span className={r.status === "reviewed" ? "text-[#217A78] font-medium" : "text-[#9A968A]"}>{r.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
