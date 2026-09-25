"use client";

import { useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MAX_IMAGE_BYTES, uploadMedia } from "@/lib/media";

/** A circle's profile picture, or its first letter on navy when none is set. */
export function CircleAvatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded Supabase Storage object
    return <img src={url} alt="" width={size} height={size} className="shrink-0 rounded-md object-cover bg-[#EFEDE6]" style={{ width: size, height: size }} />;
  }
  return (
    <span aria-hidden className="shrink-0 rounded-md bg-[#26364A] text-white font-semibold flex items-center justify-center"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}>
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

const IMAGE_TYPES = "image/jpeg,image/png,image/webp";

/** Admin-only controls to upload, replace, or remove a circle's picture. */
export function CircleAvatarEditor({
  circleId,
  url,
  onChange,
}: {
  circleId: string;
  url: string | null;
  onChange: (url: string | null) => void;
}) {
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (avatarUrl: string | null) => {
    const res = await fetch(`/api/circles/${circleId}/avatar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Couldn't update the picture.");
    onChange(data.avatarUrl);
  };

  const pick = async (f: File | undefined) => {
    if (!f || !profile) return;
    if (!IMAGE_TYPES.split(",").includes(f.type)) { setError("Choose a JPG, PNG, or WEBP image."); return; }
    if (f.size > MAX_IMAGE_BYTES) { setError("Image is too large (8MB max)."); return; }
    setBusy(true);
    setError(null);
    try {
      const { imageUrl } = await uploadMedia(profile.id, f);
      await save(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update the picture.");
    }
    setBusy(false);
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try { await save(null); } catch (err) { setError(err instanceof Error ? err.message : "Couldn't remove the picture."); }
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap text-[12px]">
      <label className={`inline-flex items-center gap-1.5 font-medium text-[#26364A] cursor-pointer hover:underline ${busy ? "opacity-50 pointer-events-none" : ""}`}>
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
        {url ? "Change circle photo" : "Add circle photo"}
        <input type="file" accept={IMAGE_TYPES} className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
      {url && !busy && (
        <button onClick={remove} className="inline-flex items-center gap-1 font-medium text-[#9A968A] hover:text-[#B23B3B]">
          <Trash2 size={12} /> Remove
        </button>
      )}
      <span className="text-[11px] text-[#9A968A]">Admin only</span>
      {error && <span className="w-full text-[#B23B3B]">{error}</span>}
    </div>
  );
}
