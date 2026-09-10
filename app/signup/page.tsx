"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const inputClass = "w-full px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] transition-colors";
  const canSubmit = email.trim() && password.length >= 6 && nickname.trim() && !sending;

  const signInWithGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const submit = async () => {
    setError(null);
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: nickname.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setSending(false);
    if (error) { setError(error.message); return; }
    setDone(true);
  };

  if (done) {
    return (
      <div className="max-w-sm mx-auto px-6 py-20 text-center">
        <CheckCircle2 size={32} className="text-[#217A78] mx-auto mb-3" />
        <h1 className="text-[18px] font-semibold text-[#1C1B19] mb-2">Check your email</h1>
        <p className="text-[14px] text-[#5B584F]">
          We sent a confirmation link to <strong>{email}</strong>. Click it to finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-[22px] font-semibold text-[#1C1B19] mb-1">Create an account</h1>
      <p className="text-[13px] text-[#9A968A] mb-6">Join the conversation — post under a nickname if you&apos;d rather not use your name.</p>

      <button onClick={signInWithGoogle}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E6E3DA] text-[14px] font-medium text-[#1C1B19] mb-4 hover:bg-[#FAF9F7] transition-colors">
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-[#E6E3DA]" />
        <span className="text-[12px] text-[#9A968A]">or</span>
        <div className="h-px flex-1 bg-[#E6E3DA]" />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Nickname</label>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="What should we call you?" className={inputClass} />
          <p className="text-[11px] text-[#9A968A] mt-1">This is what other parents see — never your real name unless you want it to be.</p>
        </div>
        <div>
          <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
        </div>
        <div>
          <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className={inputClass} />
        </div>
        {error && <p className="text-[13px] text-[#B23B3B]">{error}</p>}
        <button disabled={!canSubmit} onClick={submit}
          className="px-4 py-2.5 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-[#1e2c3d] transition-colors">
          {sending && <Loader2 size={14} className="animate-spin" />} Sign up
        </button>
      </div>

      <p className="text-[13px] text-[#9A968A] mt-6 text-center">
        Already have an account? <Link href="/login" className="text-[#26364A] font-medium hover:underline">Log in</Link>
      </p>
    </div>
  );
}
