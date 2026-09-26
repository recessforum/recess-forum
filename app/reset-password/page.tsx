"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Reached from the reset email via /auth/callback (or /auth/confirm), which
// has already signed the user in with a short-lived recovery session.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "no-session">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setStatus(data.user ? "ready" : "no-session"));
  }, []);

  const inputClass = "w-full px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] transition-colors";
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= 6 && confirm === password && !saving;

  const submit = async () => {
    setError(null);
    setSaving(true);
    const { error } = await createClient().auth.updateUser({ password });
    setSaving(false);
    if (error) { setError(error.message); return; }
    router.push("/");
    router.refresh();
  };

  if (status === "checking") {
    return <div className="flex justify-center py-24"><Loader2 size={20} className="animate-spin text-[#9A968A]" /></div>;
  }

  if (status === "no-session") {
    return (
      <div className="max-w-sm mx-auto px-6 py-16">
        <h1 className="text-[22px] font-semibold text-[#1C1B19] mb-2">This link has expired</h1>
        <p className="text-[14px] text-[#5B584F] leading-relaxed mb-6">
          Reset links work once and expire after a while. They also need to be opened in the same browser you requested them from.
        </p>
        <Link href="/forgot-password"
          className="inline-block px-4 py-2.5 text-[14px] font-semibold bg-[#26364A] text-white hover:bg-[#1e2c3d] transition-colors">
          Send a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-[22px] font-semibold text-[#1C1B19] mb-1">Choose a new password</h1>
      <p className="text-[13px] text-[#9A968A] mb-6">At least 6 characters.</p>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">New password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus
            autoComplete="new-password" className={inputClass} />
        </div>
        <div>
          <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Confirm new password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password"
            className={inputClass} onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()} />
          {mismatch && <p className="text-[12px] text-[#B23B3B] mt-1">Passwords don&apos;t match.</p>}
        </div>
        {error && <p className="text-[13px] text-[#B23B3B]">{error}</p>}
        <button disabled={!canSubmit} onClick={submit}
          className="px-4 py-2.5 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-[#1e2c3d] transition-colors">
          {saving && <Loader2 size={14} className="animate-spin" />} Save password
        </button>
      </div>
    </div>
  );
}
