"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, LogOut, Plus, Shield } from "lucide-react";
import { RecessMark } from "./RecessMark";
import { NewPostModal } from "./NewPostModal";
import { ExpertApplicationModal } from "./ExpertApplicationModal";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { Promo } from "@/lib/types";

export function Header() {
  const router = useRouter();
  const { profile } = useAuth();
  const [showNewPost, setShowNewPost] = useState(false);
  const [showExpertApp, setShowExpertApp] = useState(false);

  const handleNewPost = async (input: { title: string; body: string; topicId: string; state: string; promo: Promo | null }) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    setShowNewPost(false);
    if (data.post) router.push(`/post/${data.post.id}`);
  };

  const handleExpertApplication = async (input: { expertType: string; credentialInfo: string; filePath: string | null }) => {
    await fetch("/api/expert-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="border-b border-[#E6E3DA] bg-white">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <RecessMark size={30} />
          <div className="flex items-baseline gap-2.5">
            <span className="text-[19px] font-semibold tracking-tight text-[#1C1B19]">Recess Forum</span>
            <span className="text-[13px] text-[#9A968A] hidden sm:inline">for parents navigating school</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {profile ? (
            <>
              {profile.role === "admin" && (
                <Link href="/admin" className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#5B584F] hover:text-[#26364A] transition-colors">
                  <Shield size={15} /> Admin
                </Link>
              )}
              <button onClick={() => setShowExpertApp(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#5B584F] hover:text-[#217A78] transition-colors">
                <BadgeCheck size={15} /> Become a Verified Expert
              </button>
              <button onClick={() => setShowNewPost(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#26364A] text-white text-[13px] font-medium hover:bg-[#1e2c3d] transition-colors">
                <Plus size={15} /> New post
              </button>
              <span className="hidden sm:inline text-[13px] text-[#5B584F] ml-1">{profile.display_name}</span>
              <button onClick={logout} title="Log out" className="p-2 text-[#9A968A] hover:text-[#1C1B19] transition-colors">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-[13px] font-medium text-[#5B584F] hover:text-[#1C1B19] transition-colors">Log in</Link>
              <Link href="/signup" className="px-3.5 py-2 bg-[#26364A] text-white text-[13px] font-medium hover:bg-[#1e2c3d] transition-colors">Sign up</Link>
            </>
          )}
        </div>
      </div>

      {showNewPost && profile && (
        <NewPostModal defaultTopic={null} onClose={() => setShowNewPost(false)} onSubmit={handleNewPost} />
      )}
      {showExpertApp && profile && (
        <ExpertApplicationModal onClose={() => setShowExpertApp(false)} onSubmit={handleExpertApplication} />
      )}
    </header>
  );
}
