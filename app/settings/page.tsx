"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import type { BlockedUser } from "@/lib/types";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, true> = { "image/jpeg": true, "image/png": true, "image/webp": true };

export default function SettingsPage() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<BlockedUser[] | null>(null);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    fetch("/api/blocks")
      .then((r) => r.json())
      .then((d) => setBlocked(d.blocked || []));
  }, [profile]);

  const handleUpload = async (file: File | undefined) => {
    if (!file || !profile) return;
    setAvatarError(null);

    if (!ALLOWED_TYPES[file.type]) {
      setAvatarError("Only JPG, PNG, or WEBP images are accepted.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setAvatarError("File is too large (5MB max).");
      return;
    }

    setUploading(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${profile.id}/avatar.${ext}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      setAvatarError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    // cache-bust so the new image shows immediately even though the path is unchanged
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl }),
    });
    await refreshProfile();
    setUploading(false);
  };

  const unblock = async (userId: string) => {
    setUnblockingId(userId);
    await fetch("/api/blocks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setBlocked((b) => b?.filter((u) => u.id !== userId) ?? null);
    setUnblockingId(null);
  };

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1C1B19] mb-2">Log in to see your settings</p>
        <button onClick={() => router.push("/login")} className="text-[14px] font-medium text-[#26364A] hover:underline">Log in</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10 w-full">
      <h1 className="text-[22px] font-semibold text-[#1C1B19] mb-6">Settings</h1>

      <section className="mb-10">
        <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-3">Profile picture</h2>
        <div className="flex items-center gap-4">
          <Avatar url={profile.avatar_url} name={profile.display_name} size={56} />
          <div>
            <label className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#5B584F] cursor-pointer border border-dashed border-[#E6E3DA] bg-[#FAF9F7] hover:border-[#26364A] transition-colors">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Uploading..." : "Upload a photo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading}
                onChange={(e) => handleUpload(e.target.files?.[0])} />
            </label>
            <p className="text-[11px] text-[#9A968A] mt-1.5">JPG, PNG, or WEBP — 5MB max. No photo? We show your initial instead.</p>
            {avatarError && <p className="text-[12px] text-[#B23B3B] mt-1.5">{avatarError}</p>}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-3">Blocked users</h2>
        {blocked === null ? (
          <p className="text-[13px] text-[#9A968A] flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading...</p>
        ) : blocked.length === 0 ? (
          <p className="text-[13px] text-[#9A968A] italic">You haven&apos;t blocked anyone.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {blocked.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b border-[#E6E3DA]">
                <Avatar url={u.avatarUrl} name={u.displayName} size={28} />
                <span className="text-[14px] text-[#1C1B19] flex-1">{u.displayName}</span>
                <button disabled={unblockingId === u.id} onClick={() => unblock(u.id)}
                  className="text-[13px] font-medium text-[#26364A] hover:underline disabled:opacity-40">
                  {unblockingId === u.id ? "Unblocking..." : "Unblock"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
