"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/** Settings section for Verified Experts: the bio and website shown on their public profile. */
export function ExpertProfileSettings({ userId }: { userId: string }) {
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/profiles/${userId}`).then((r) => r.json()).then((d) => {
      setBio(d.profile?.bio ?? "");
      setWebsite(d.profile?.website ?? "");
      setLoaded(true);
    });
  }, [userId]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/profile/expert", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, website }),
    });
    const d = await res.json().catch(() => ({}));
    setMessage(res.ok ? { ok: true, text: "Saved. It's on your public profile now." } : { ok: false, text: d.error || "Couldn't save." });
    setSaving(false);
  };

  const inputClass = "w-full px-3 py-2 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A]";
  return (
    <section className="mb-10">
      <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-3">Expert profile</h2>
      {!loaded ? (
        <p className="text-[13px] text-[#9A968A] flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading...</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Short bio</label>
            <textarea value={bio} maxLength={400} onChange={(e) => { setBio(e.target.value); setMessage(null); }}
              placeholder="Special education advocate helping families in the Bay Area since 2012."
              className={`${inputClass} min-h-[80px]`} />
            <p className="text-[11px] text-[#9A968A] mt-1">{bio.length}/400</p>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Practice website (optional)</label>
            <input value={website} onChange={(e) => { setWebsite(e.target.value); setMessage(null); }} placeholder="https://yourpractice.com" className={inputClass} />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving}
              className="px-3 py-2 text-[13px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-2 hover:bg-[#1e2c3d]">
              {saving && <Loader2 size={14} className="animate-spin" />} Save
            </button>
            {message && <span className={`text-[12px] ${message.ok ? "text-[#217A78]" : "text-[#B23B3B]"}`}>{message.text}</span>}
          </div>
        </div>
      )}
    </section>
  );
}
