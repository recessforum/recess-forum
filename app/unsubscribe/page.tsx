"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function UnsubscribePage() {
  return (
    <Suspense>
      <Unsubscribe />
    </Suspense>
  );
}

function Unsubscribe() {
  const params = useSearchParams();
  const token = params.get("t") ?? "";
  const digest = params.get("k") === "digest";
  const what = digest ? "the weekly digest" : "topic alerts";
  const [state, setState] = useState<"idle" | "working" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const unsubscribe = async () => {
    setState("working");
    setError(null);
    const res = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ t: token, k: digest ? "digest" : undefined }),
    });
    if (res.ok) { setState("done"); return; }
    setError((await res.json().catch(() => ({}))).error || "Something went wrong. Please try again.");
    setState("idle");
  };

  if (state === "done") {
    return (
      <div className="max-w-sm mx-auto px-6 py-20 text-center">
        <CheckCircle2 size={32} className="text-[#217A78] mx-auto mb-3" />
        <h1 className="text-[18px] font-semibold text-[#1C1B19] mb-2">You&apos;re unsubscribed</h1>
        <p className="text-[14px] text-[#5B584F] leading-relaxed">
          You won&apos;t get {what} anymore. You can turn it back on anytime in{" "}
          <Link href="/settings" className="text-[#26364A] font-medium hover:underline">Settings</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-20 text-center">
      <h1 className="text-[20px] font-semibold text-[#1C1B19] mb-2">Unsubscribe from {what}?</h1>
      <p className="text-[14px] text-[#5B584F] leading-relaxed mb-6">
        {digest ? "You'll stop getting the weekly digest email." : "You'll stop getting emails about new posts in the topics you picked."} Your account stays as it is.
      </p>
      {error && <p className="text-[13px] text-[#B23B3B] mb-3">{error}</p>}
      <button onClick={unsubscribe} disabled={!token || state === "working"}
        className="px-5 py-2.5 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 inline-flex items-center gap-2 hover:bg-[#1e2c3d] transition-colors">
        {state === "working" && <Loader2 size={14} className="animate-spin" />} Unsubscribe
      </button>
      {!token && <p className="text-[13px] text-[#9A968A] mt-4">This link is missing its code. Use the link in your email, or change alerts in Settings.</p>}
    </div>
  );
}
