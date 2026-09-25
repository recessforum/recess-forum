"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { checkMedia, MEDIA_ACCEPT } from "@/lib/media";

/** Pick one photo or video, with a preview. `compact` is a small inline
 *  button for reply boxes; the default is a full-width drop area for forms. */
export function MediaPicker({
  file,
  onChange,
  compact = false,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  compact?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  // The preview URL is made when a file is picked (not during render) and
  // only shown while the parent still holds that same file.
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);
  const preview = picked && picked.file === file ? picked.url : null;
  useEffect(() => () => { if (picked) URL.revokeObjectURL(picked.url); }, [picked]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const res = checkMedia(f);
    if ("error" in res) { setError(res.error); onChange(null); return; }
    setError(null);
    setPicked({ file: f, url: URL.createObjectURL(f) });
    onChange(f);
  };

  if (file && preview) {
    const isVideo = file.type.startsWith("video/");
    return (
      <div className={`relative ${compact ? "max-w-xs" : ""}`}>
        {isVideo ? (
          <video src={preview} controls playsInline className={`w-full bg-black ${compact ? "max-h-40" : "max-h-56"}`} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview before upload
          <img src={preview} alt="Selected" className={`w-full object-contain bg-[#EFEDE6] ${compact ? "max-h-40" : "max-h-56"}`} />
        )}
        <button type="button" onClick={() => onChange(null)} aria-label="Remove photo or video"
          className="absolute top-2 right-2 p-1 bg-black/60 text-white hover:bg-black/80">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div>
      {compact ? (
        <label className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#5B584F] cursor-pointer hover:text-[#26364A]">
          <ImagePlus size={14} /> Photo / video
          <input type="file" accept={MEDIA_ACCEPT} className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      ) : (
        <label className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#5B584F] cursor-pointer border border-dashed border-[#E6E3DA] bg-[#FAF9F7] hover:border-[#26364A] transition-colors">
          <Upload size={15} /> Choose a photo or video
          <input type="file" accept={MEDIA_ACCEPT} className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      )}
      {error && <p className="text-[12px] text-[#B23B3B] mt-1.5">{error}</p>}
    </div>
  );
}

/** Shows an uploaded photo or video (posts, replies, circles). */
export function MediaView({ imageUrl, videoUrl, className = "" }: { imageUrl: string | null; videoUrl: string | null; className?: string }) {
  if (videoUrl) {
    return <video src={`${videoUrl}#t=0.1`} controls playsInline preload="metadata" onClick={(e) => e.stopPropagation()} className={`w-full max-h-96 bg-black ${className}`} />;
  }
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded media, arbitrary Supabase Storage objects
    return <img src={imageUrl} alt="" className={`w-full max-h-96 object-contain bg-[#EFEDE6] ${className}`} />;
  }
  return null;
}
