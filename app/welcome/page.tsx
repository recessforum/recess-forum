"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function WelcomePage() {
  return (
    <Suspense>
      <WelcomeForm />
    </Suspense>
  );
}

function WelcomeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const inputClass = "w-full px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] transition-colors";
  const canSubmit = nickname.trim().length >= 2 && !saving;

  const submit = async () => {
    setError(null);
    setSaving(true);
    const res = await fetch("/api/profile/nickname", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: nickname.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      setSaving(false);
      return;
    }
    await refreshProfile();
    router.push(searchParams.get("next") || "/");
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-[22px] font-semibold text-[#1C1B19] mb-1">Welcome to Recess Forum</h1>
      <p className="text-[13px] text-[#9A968A] mb-6">Pick a nickname — this is what other parents will see. Never your real name unless you want it to be.</p>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Nickname</label>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="What should we call you?" className={inputClass}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()} autoFocus />
        </div>
        {error && <p className="text-[13px] text-[#B23B3B]">{error}</p>}
        <button disabled={!canSubmit} onClick={submit}
          className="px-4 py-2.5 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-[#1e2c3d] transition-colors">
          {saving && <Loader2 size={14} className="animate-spin" />} Continue
        </button>
      </div>
    </div>
  );
}
