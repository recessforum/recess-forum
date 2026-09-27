"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { parsePrefs, saveTopicPrefs, takePendingTopicPrefs, type TopicPrefs } from "@/lib/topic-alerts";
import { TopicPicker } from "./TopicPicker";

/* Every member picks at least one topic. Choices made on /signup (carried
   through OAuth in localStorage or through email confirmation in
   user_metadata) are saved silently here; anyone else (accounts from before
   this existed, or Google/Apple signups from the login page) is asked once.
   Waits for AccountTypeGate so the two never stack. */
export function InterestsGate() {
  const { profile } = useAuth();
  const [asking, setAsking] = useState(false);
  const [value, setValue] = useState<TopicPrefs>({ categories: [], categoryEmails: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checked = useRef<string | null>(null);

  const ready = !!profile?.account_type;

  useEffect(() => {
    if (!ready || !profile || checked.current === profile.id) return;
    checked.current = profile.id;
    (async () => {
      const res = await fetch("/api/notification-prefs");
      if (!res.ok) return;
      const { prefs } = await res.json();
      if (prefs) return; // already chosen

      let pending = takePendingTopicPrefs();
      if (!pending) {
        const { data } = await createClient().auth.getUser();
        pending = parsePrefs(data.user?.user_metadata?.topic_prefs);
      }
      if (pending) {
        try { await saveTopicPrefs(pending); return; } catch { /* fall through and ask */ }
      }
      setAsking(true);
    })();
  }, [ready, profile]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveTopicPrefs(value);
      setAsking(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
    setSaving(false);
  };

  if (!asking) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div role="dialog" aria-modal="true" aria-labelledby="interests-title"
        className="w-full sm:max-w-md bg-white p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 id="interests-title" className="text-[17px] font-semibold text-[#1C1B19] mb-1">What are you here for?</h2>
        <p className="text-[13px] text-[#5B584F] mb-4">Pick the topics you care about. You can change them anytime in Settings.</p>
        <TopicPicker value={value} onChange={setValue} />
        {error && <p className="text-[13px] text-[#B23B3B] mt-3">{error}</p>}
        <button disabled={value.categories.length === 0 || saving} onClick={save}
          className="mt-4 w-full px-4 py-2.5 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-[#1e2c3d] transition-colors">
          {saving && <Loader2 size={14} className="animate-spin" />} Continue
        </button>
      </div>
    </div>
  );
}
