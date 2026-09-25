"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { decodePlace } from "@/lib/location";
import { useAuth } from "@/lib/auth-context";
import { uploadMedia } from "@/lib/media";
import { LocationSelect } from "./LocationSelect";
import { MediaPicker } from "./MediaPicker";

export interface NewCircleInput {
  name: string;
  description: string;
  state: string | null;
  /** null when the circle isn't tied to a place. */
  country: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
}

export function CreateCircleModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: NewCircleInput) => Promise<void>;
}) {
  const { profile } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [place, setPlace] = useState(""); // encoded: "" (anywhere), "NY", or "c:AU"
  const [media, setMedia] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputClass = "w-full px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] transition-colors";
  const canSubmit = name.trim() && description.trim() && !saving;

  const handleSubmit = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const urls = media ? await uploadMedia(profile.id, media) : { imageUrl: null, videoUrl: null };
      const location = decodePlace(place);
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        state: location?.state ?? null,
        country: location?.country ?? null,
        ...urls,
      });
    } catch (err) {
      setError(err instanceof Error && err.message !== "failed" ? err.message : "Couldn't create the circle. Try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(28,27,25,0.55)" }}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E3DA]">
          <h2 className="text-[17px] font-semibold text-[#1C1B19]">Create a circle</h2>
          <button onClick={onClose} className="text-[#9A968A] hover:text-[#1C1B19]"><X size={18} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label htmlFor="circle-name" className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Name</label>
            <input id="circle-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Homeschool Moms in Austin" className={inputClass} />
          </div>
          <div>
            <label htmlFor="circle-description" className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Description</label>
            <textarea id="circle-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="What's this circle for, and who should join?" className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label htmlFor="circle-location" className="text-[12px] font-medium text-[#5B584F] block mb-1.5">
              Location <span className="text-[#9A968A] font-normal">(optional)</span>
            </label>
            <LocationSelect id="circle-location" value={place} onChange={setPlace} placeholder="Not location-specific" className={inputClass} />
          </div>
          <div>
            <div className="text-[12px] font-medium text-[#5B584F] mb-1.5">
              Photo or video <span className="text-[#9A968A] font-normal">(optional)</span>
            </div>
            <MediaPicker file={media} onChange={setMedia} />
          </div>
          {error && <p className="text-[13px] text-[#B23B3B]">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-[#E6E3DA] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-medium text-[#5B584F] hover:text-[#1C1B19]">Cancel</button>
          <button disabled={!canSubmit} onClick={handleSubmit}
            className="px-4 py-2 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-2 hover:bg-[#1e2c3d] transition-colors">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
