"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { uploadMedia } from "@/lib/media";
import { MediaPicker } from "./MediaPicker";

export interface ReplyInput {
  body: string;
  imageUrl: string | null;
  videoUrl: string | null;
}

/** Reply box with an optional photo or video: used for top-level replies on
 *  a post and for replies to a reply. A reply needs text, media, or both. */
export function ReplyComposer({
  onSubmit,
  onCancel,
  compact = false,
}: {
  onSubmit: (input: ReplyInput) => Promise<void>;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const { profile } = useAuth();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSend = (text.trim() || file) && !sending;

  const submit = async () => {
    if (!profile || !canSend) return;
    setSending(true);
    setError(null);
    try {
      const media = file ? await uploadMedia(profile.id, file) : { imageUrl: null, videoUrl: null };
      await onSubmit({ body: text.trim(), ...media });
      setText("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
    setSending(false);
  };

  const small = compact;
  return (
    <div>
      <p className={`${small ? "text-[11px]" : "text-[12px]"} text-[#9A968A] mb-1.5`}>Replying as {profile?.display_name}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={small ? 2 : 3}
        placeholder={small ? "Write a reply..." : "Add your reply..."}
        className={`w-full mb-2 px-3 ${small ? "py-2 text-[13px]" : "py-2.5 text-[14px]"} border border-[#E6E3DA] bg-[#FAF9F7] outline-none focus:border-[#26364A] resize-none`} />
      <div className="mb-2">
        <MediaPicker file={file} onChange={setFile} compact />
      </div>
      {error && <p className="text-[12px] text-[#B23B3B] mb-2">{error}</p>}
      <div className="flex gap-2">
        <button disabled={!canSend} onClick={submit}
          className={`${small ? "px-3 py-1.5 text-[12px]" : "px-4 py-2 text-[14px]"} font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-1.5 hover:bg-[#1e2c3d] transition-colors`}>
          {sending && <Loader2 size={small ? 12 : 14} className="animate-spin" />} Reply
        </button>
        {onCancel && (
          <button onClick={onCancel} className="px-3 py-1.5 text-[12px] font-medium text-[#5B584F]">Cancel</button>
        )}
      </div>
    </div>
  );
}
