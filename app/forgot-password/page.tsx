"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = "w-full px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] transition-colors";
  const canSubmit = /\S+@\S+\.\S+/.test(email.trim()) && !sending;

  const submit = async () => {
    setError(null);
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setSending(false);
    // Rate limits are worth surfacing; anything else gets the same neutral
    // message so the form doesn't reveal which emails have accounts.
    if (error && error.status === 429) { setError("Too many requests. Please wait a few minutes and try again."); return; }
    setSent(true);
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-[22px] font-semibold text-[#1C1B19] mb-1">Reset your password</h1>

      {sent ? (
        <div className="mt-6">
          <div className="flex items-start gap-3 p-4 bg-[#F5EFDD] text-[#5B584F] text-[14px] leading-relaxed">
            <MailCheck size={18} className="text-[#B08D45] shrink-0 mt-0.5" />
            <p>
              If an account uses <span className="font-medium text-[#1C1B19]">{email.trim()}</span>, we sent a link to reset
              your password. Open it on this device and browser. Check your spam folder if you don&apos;t see it in a few minutes.
            </p>
          </div>
          <button onClick={() => setSent(false)} className="text-[13px] text-[#26364A] font-medium hover:underline mt-4">
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <p className="text-[13px] text-[#9A968A] mb-6">Enter the email you signed up with and we&apos;ll send you a reset link.</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className={inputClass} autoFocus onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()} />
            </div>
            {error && <p className="text-[13px] text-[#B23B3B]">{error}</p>}
            <button disabled={!canSubmit} onClick={submit}
              className="px-4 py-2.5 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-[#1e2c3d] transition-colors">
              {sending && <Loader2 size={14} className="animate-spin" />} Send reset link
            </button>
          </div>
        </>
      )}

      <div className="mt-8 pt-6 border-t border-[#E6E3DA]">
        <h2 className="text-[14px] font-semibold text-[#1C1B19] mb-2">Forgot which email you used?</h2>
        <ul className="text-[13px] text-[#5B584F] leading-relaxed list-disc pl-5 flex flex-col gap-1.5">
          <li>If you signed up with Apple or Google, you don&apos;t have a password. Use <span className="font-medium">Continue with Apple</span> or <span className="font-medium">Continue with Google</span> on the log in page.</li>
          <li>Search your inboxes for emails from Recess Forum. The address that received them is your login.</li>
          <li>Still stuck? Email <a href="mailto:recessforum@gmail.com" className="text-[#26364A] font-medium hover:underline">recessforum@gmail.com</a> with your nickname and we&apos;ll help.</li>
        </ul>
      </div>

      <p className="text-[13px] text-[#9A968A] mt-6 text-center">
        <Link href="/login" className="text-[#26364A] font-medium hover:underline">Back to log in</Link>
      </p>
    </div>
  );
}
