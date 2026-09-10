"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error") ? "Something went wrong signing you in — try again." : null);
  const [sending, setSending] = useState(false);

  const inputClass = "w-full px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] transition-colors";
  const canSubmit = email.trim() && password && !sending;

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
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSending(false);
    if (error) { setError(error.message); return; }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-[22px] font-semibold text-[#1C1B19] mb-1">Welcome back</h1>
      <p className="text-[13px] text-[#9A968A] mb-6">Log in to post, comment, and vote.</p>

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
          <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()} />
        </div>
        <div>
          <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className={inputClass}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()} />
        </div>
        {error && <p className="text-[13px] text-[#B23B3B]">{error}</p>}
        <button disabled={!canSubmit} onClick={submit}
          className="px-4 py-2.5 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-[#1e2c3d] transition-colors">
          {sending && <Loader2 size={14} className="animate-spin" />} Log in
        </button>
      </div>

      <p className="text-[13px] text-[#9A968A] mt-6 text-center">
        New here? <Link href="/signup" className="text-[#26364A] font-medium hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
