"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { EXPERT_DAILY_ALERT_CAP, EXPERT_DAILY_CONSENT_TEXT, saveTopicPrefs, type TopicPrefs } from "@/lib/topic-alerts";
import { TopicPicker } from "./TopicPicker";

/** Settings section: topics, topic alert opt-in, and reply email on/off. */
export function EmailSettings() {
  const [prefs, setPrefs] = useState<TopicPrefs | null>(null);
  const [replyEmails, setReplyEmails] = useState(true);
  const [isExpert, setIsExpert] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/notification-prefs").then((r) => (r.ok ? r.json() : null)).then((d) => {
      setPrefs(d?.prefs ?? { categories: [], categoryEmails: false });
      if (d) { setReplyEmails(d.replyEmails); setIsExpert(d.isExpert === true); }
    });
  }, []);

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    setMessage(null);
    try {
      await saveTopicPrefs(prefs, { replyEmails });
      setMessage({ ok: true, text: "Saved." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Couldn't save. Please try again." });
    }
    setSaving(false);
  };

  return (
    <section className="mb-10">
      <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-3">Topics &amp; email</h2>
      {!prefs ? (
        <p className="text-[13px] text-[#9A968A] flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading...</p>
      ) : (
        <>
          <TopicPicker value={prefs} onChange={(v) => { setPrefs(v); setMessage(null); }} />
          <label className="flex items-start gap-2 mt-3 cursor-pointer">
            <input type="checkbox" checked={replyEmails} onChange={(e) => { setReplyEmails(e.target.checked); setMessage(null); }}
              className="mt-0.5 shrink-0" />
            <span className="text-[13px] text-[#5B584F] leading-snug">Email me when someone replies to my post or comment.</span>
          </label>
          {isExpert && (
            <div id="expert-alerts" className="mt-4 border border-[#BFE0DE] bg-[#F1F8F7] px-3.5 py-3">
              <p className="text-[12px] font-semibold text-[#217A78] mb-1.5">For Verified Experts</p>
              <p className="text-[12px] text-[#5B584F] leading-relaxed mb-2">
                Pick the topics you know best above. Topic alerts send you each new question as it&apos;s posted (up to {EXPERT_DAILY_ALERT_CAP} a day for experts).
                Parents can also ask you directly from their post. Those requests come by email unless you turn off reply emails above.
              </p>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={!!prefs.expertDaily}
                  onChange={(e) => { setPrefs({ ...prefs, expertDaily: e.target.checked }); setMessage(null); }} className="mt-0.5 shrink-0" />
                <span className="text-[13px] text-[#5B584F] leading-snug">{EXPERT_DAILY_CONSENT_TEXT}</span>
              </label>
            </div>
          )}
          <div className="flex items-center gap-3 mt-4">
            <button disabled={prefs.categories.length === 0 || saving} onClick={save}
              className="px-3 py-2 text-[13px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-2 hover:bg-[#1e2c3d] transition-colors">
              {saving && <Loader2 size={14} className="animate-spin" />} Save
            </button>
            {message && <span className={`text-[12px] ${message.ok ? "text-[#217A78]" : "text-[#B23B3B]"}`}>{message.text}</span>}
          </div>
        </>
      )}
    </section>
  );
}
