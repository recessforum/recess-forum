"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Upload } from "lucide-react";
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
  const [nickname, setNickname] = useState(profile?.display_name ?? "");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    fetch("/api/blocks")
      .then((r) => r.json())
      .then((d) => setBlocked(d.blocked || []));
  }, [profile]);

  useEffect(() => {
    if (profile) setNickname(profile.display_name);
  }, [profile?.display_name]);

  const saveNickname = async () => {
    if (!nickname.trim() || nickname.trim() === profile?.display_name) return;
    setNicknameSaving(true);
    setNicknameError(null);
    const res = await fetch("/api/profile/nickname", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: nickname.trim() }),
    });
    const data = await res.json();
    setNicknameSaving(false);
    if (!res.ok) { setNicknameError(data.error || "Something went wrong. Please try again."); return; }
    await refreshProfile();
  };

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

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setDeleteError(data?.error || "Something went wrong. Please try again.");
        setDeleting(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setDeleteError("Something went wrong. Please try again.");
      setDeleting(false);
    }
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-semibold text-[#1C1B19]">Settings</h1>
        <Link href={`/u/${profile.id}`} className="text-[13px] font-medium text-[#26364A] hover:underline">
          View my posts &amp; replies
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="text-[13px] font-semibold text-[#5B584F] uppercase tracking-wide mb-3">Nickname</h2>
        <div className="flex items-center gap-2">
          <input value={nickname} onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveNickname()}
            className="w-full max-w-xs px-3 py-2 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A]" />
          <button disabled={!nickname.trim() || nickname.trim() === profile.display_name || nicknameSaving} onClick={saveNickname}
            className="px-3 py-2 text-[13px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-2 hover:bg-[#1e2c3d] transition-colors">
            {nicknameSaving && <Loader2 size={14} className="animate-spin" />} Save
          </button>
        </div>
        <p className="text-[11px] text-[#9A968A] mt-1.5">This is what other parents see on your posts and replies — changing it updates everywhere immediately.</p>
        {nicknameError && <p className="text-[12px] text-[#B23B3B] mt-1.5">{nicknameError}</p>}
      </section>

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

      <section className="mt-10 pt-8 border-t border-[#E6E3DA]">
        <h2 className="text-[13px] font-semibold text-[#B23B3B] uppercase tracking-wide mb-3">Danger zone</h2>
        {!confirmingDelete ? (
          <button onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#B23B3B] border border-[#E6C9C9] hover:bg-[#FBF1F1] transition-colors">
            <Trash2 size={14} /> Delete my account
          </button>
        ) : (
          <div className="max-w-sm border border-[#E6C9C9] bg-[#FBF1F1] p-4">
            <p className="text-[13px] text-[#5B584F] mb-3">
              This permanently deletes your account and every post, reply, and vote you&apos;ve made. This can&apos;t be undone.
              Type <span className="font-semibold text-[#1C1B19]">DELETE</span> to confirm.
            </p>
            <input value={deleteText} onChange={(e) => setDeleteText(e.target.value)}
              className="w-full px-3 py-2 border border-[#E6E3DA] bg-white text-[14px] outline-none focus:border-[#B23B3B] mb-3" />
            {deleteError && <p className="text-[12px] text-[#B23B3B] mb-3">{deleteError}</p>}
            <div className="flex gap-2">
              <button disabled={deleteText !== "DELETE" || deleting} onClick={deleteAccount}
                className="flex items-center gap-2 px-3 py-2 text-[13px] font-semibold bg-[#B23B3B] text-white disabled:opacity-40 hover:bg-[#96302F] transition-colors">
                {deleting && <Loader2 size={13} className="animate-spin" />} Permanently delete
              </button>
              <button onClick={() => { setConfirmingDelete(false); setDeleteText(""); setDeleteError(null); }}
                className="px-3 py-2 text-[13px] font-medium text-[#5B584F] hover:text-[#1C1B19]">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
