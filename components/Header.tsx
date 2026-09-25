"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, LogOut, Plus, Shield, Users } from "lucide-react";
import { RecessMark } from "./RecessMark";
import { NewPostModal } from "./NewPostModal";
import { ExpertApplicationModal } from "./ExpertApplicationModal";
import { LoginRequiredModal } from "./LoginRequiredModal";
import { Avatar } from "./Avatar";
import { useAuth } from "@/lib/auth-context";
import { submitExpertApplication } from "@/lib/account-type";
import { createClient } from "@/lib/supabase/client";
import type { Promo } from "@/lib/types";

export function Header() {
  const router = useRouter();
  const { profile } = useAuth();
  const [showNewPost, setShowNewPost] = useState(false);
  const [showExpertApp, setShowExpertApp] = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);

  const handleNewPost = async (input: { title: string; body: string | null; topicId: string; state: string | null; country: string; promo: Promo | null; circleId: string | null; imageUrl: string | null; videoUrl: string | null }) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    setShowNewPost(false);
    router.push(`/post/${data.post.id}`);
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="border-b border-[#E6E3DA] bg-white">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="scale-[0.85] sm:scale-100 origin-left">
            <RecessMark size={30} />
          </div>
          <div className="flex items-baseline gap-2.5 whitespace-nowrap">
            <span className="text-[16px] sm:text-[19px] font-semibold tracking-tight text-[#1C1B19]">Recess Forum</span>
            <span className="text-[13px] text-[#9A968A] hidden sm:inline">for parents navigating school</span>
          </div>
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
          <Link href="/circles"
            onClick={(e) => { if (!profile) { e.preventDefault(); setShowLoginRequired(true); } }}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-[13px] font-medium text-[#5B584F] hover:text-[#26364A] transition-colors">
            <Users size={15} /> <span className="hidden sm:inline">Circles</span>
          </Link>
          <button onClick={() => { if (!profile) { setShowLoginRequired(true); } else { setShowNewPost(true); } }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 bg-[#26364A] text-white text-[13px] font-medium hover:bg-[#1e2c3d] transition-colors">
            <Plus size={15} /> <span className="hidden sm:inline">New post</span>
          </button>
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
              <Link href="/settings" title="Profile" className="hidden sm:flex items-center gap-1.5 ml-1 text-[13px] text-[#5B584F] hover:text-[#1C1B19] transition-colors">
                <Avatar url={profile.avatar_url} name={profile.display_name} size={22} />
                {profile.display_name}
              </Link>
              <Link href="/settings" title="Profile" className="flex sm:hidden items-center p-1">
                <Avatar url={profile.avatar_url} name={profile.display_name} size={24} />
              </Link>
              <button onClick={logout} className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-2 text-[13px] font-medium text-[#5B584F] hover:text-[#1C1B19] transition-colors whitespace-nowrap">
                <LogOut size={15} className="hidden sm:block" /> Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-2 sm:px-3 py-2 text-[13px] font-medium text-[#5B584F] hover:text-[#1C1B19] transition-colors whitespace-nowrap">Log in</Link>
              <Link href="/signup" className="px-2.5 sm:px-3.5 py-2 bg-[#26364A] text-white text-[13px] font-medium hover:bg-[#1e2c3d] transition-colors whitespace-nowrap">Sign up</Link>
            </>
          )}
        </div>
      </div>

      {showNewPost && profile && (
        <NewPostModal defaultTopic={null} onClose={() => setShowNewPost(false)} onSubmit={handleNewPost} />
      )}
      {showExpertApp && profile && (
        <ExpertApplicationModal onClose={() => setShowExpertApp(false)} onSubmit={submitExpertApplication} />
      )}
      {showLoginRequired && (
        <LoginRequiredModal onClose={() => setShowLoginRequired(false)} />
      )}
    </header>
  );
}
