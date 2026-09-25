"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import {
  claimAccountType, submitExpertApplication, takePendingAccountType, type AccountType,
} from "@/lib/account-type";
import { AccountTypeChoice } from "./AccountTypeChoice";
import { ExpertApplicationModal } from "./ExpertApplicationModal";

/* Every account needs an account type: it decides Founding Parent eligibility.
   Signups that already chose one (on /signup, carried through OAuth in
   localStorage or through email confirmation in user_metadata) are claimed
   silently here; anyone else (accounts from before this existed, or someone
   who signed up from the login page with Google/Apple) is asked once.
   Anyone who picks "Professional / expert" gets the Verified Expert
   application form right after. */
export function AccountTypeGate() {
  const { profile, refreshProfile } = useAuth();
  const [asking, setAsking] = useState(false);
  const [choice, setChoice] = useState<AccountType | null>(null);
  const [showExpertApp, setShowExpertApp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tried = useRef(false);

  const needsType = !!profile && !profile.account_type;

  useEffect(() => {
    if (!needsType || tried.current) return;
    tried.current = true;
    (async () => {
      let pending = takePendingAccountType();
      if (!pending) {
        const { data } = await createClient().auth.getUser();
        const meta = data.user?.user_metadata?.account_type;
        if (meta === "parent" || meta === "provider" || meta === "expert") pending = meta;
      }
      if (pending) {
        try {
          await claimAccountType(pending);
          await refreshProfile();
          if (pending === "expert") setShowExpertApp(true);
          return;
        } catch { /* fall through and ask */ }
      }
      setAsking(true);
    })();
  }, [needsType, refreshProfile]);

  const save = async () => {
    if (!choice) return;
    setSaving(true);
    setError(null);
    try {
      await claimAccountType(choice);
      await refreshProfile();
      setAsking(false);
      if (choice === "expert") setShowExpertApp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
    setSaving(false);
  };

  if (showExpertApp && profile) {
    return <ExpertApplicationModal onClose={() => setShowExpertApp(false)} onSubmit={submitExpertApplication} />;
  }

  if (!needsType || !asking) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div role="dialog" aria-modal="true" aria-labelledby="account-type-title"
        className="w-full sm:max-w-sm bg-white p-5 sm:p-6 shadow-xl">
        <h2 id="account-type-title" className="text-[17px] font-semibold text-[#1C1B19] mb-1">One quick question</h2>
        <p className="text-[13px] text-[#5B584F] mb-4">This helps us keep Recess Forum a place for parents. You&apos;ll only be asked once.</p>
        <AccountTypeChoice value={choice} onChange={setChoice} />
        {error && <p className="text-[13px] text-[#B23B3B] mt-3">{error}</p>}
        <button disabled={!choice || saving} onClick={save}
          className="mt-4 w-full px-4 py-2.5 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-[#1e2c3d] transition-colors">
          {saving && <Loader2 size={14} className="animate-spin" />} Continue
        </button>
      </div>
    </div>
  );
}
