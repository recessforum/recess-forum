"use client";

import { useState } from "react";
import { Briefcase, Loader2, Users, X } from "lucide-react";
import { CATEGORIES } from "@/lib/taxonomy";
import { US_STATES, zipToState } from "@/lib/location";
import { useAuth } from "@/lib/auth-context";
import type { Promo } from "@/lib/types";

export function NewPostModal({
  defaultTopic,
  circleId = null,
  circleName = null,
  onClose,
  onSubmit,
}: {
  defaultTopic: string | null;
  circleId?: string | null;
  circleName?: string | null;
  onClose: () => void;
  onSubmit: (input: { title: string; body: string; topicId: string; state: string; promo: Promo | null; circleId: string | null }) => Promise<void>;
}) {
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [zip, setZip] = useState("");
  const [state, setState] = useState("");
  const [topicId, setTopicId] = useState(defaultTopic || CATEGORIES[0].topics[0].id);
  const [promoLabel, setPromoLabel] = useState("");
  const [promoUrl, setPromoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const canSubmit = title.trim() && body.trim() && state && !saving;
  const inputClass = "w-full px-3 py-2.5 border border-[#E6E3DA] bg-[#FAF9F7] text-[14px] outline-none focus:border-[#26364A] transition-colors";
  const isVerifiedExpert = profile?.role === "verified_expert";

  const handleZipChange = (val: string) => {
    setZip(val);
    const digits = val.replace(/\D/g, "");
    if (digits.length >= 3) {
      const detected = zipToState(digits);
      if (detected) setState(detected);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(28,27,25,0.55)" }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E3DA]">
          <div>
            <h2 className="text-[17px] font-semibold text-[#1C1B19]">Start a discussion</h2>
            <p className="text-[12px] text-[#9A968A] mt-0.5">Posting as {profile?.display_name}</p>
          </div>
          <button onClick={onClose} className="text-[#9A968A] hover:text-[#1C1B19]"><X size={18} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {circleName && (
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#5B584F] bg-[#EFEDE6] px-3 py-2 -mb-1">
              <Users size={13} /> Posting in: {circleName}
            </div>
          )}
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's your question or insight?" className={inputClass} />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Details</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Give other parents the context they need to help."
              className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <div>
              <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">
                Current state <span className="text-[#B85A3A]">*</span>
              </label>
              <select value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
                <option value="">Select a state</option>
                {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">
                Zip code <span className="text-[#9A968A] font-normal">(optional)</span>
              </label>
              <input value={zip} onChange={(e) => handleZipChange(e.target.value)} placeholder="e.g. 90210" inputMode="numeric" maxLength={10} className={inputClass} />
            </div>
          </div>
          <p className="text-[12px] text-[#9A968A] -mt-2">
            We only ever show your state, never your zip — typing a zip just auto-fills the state for you.
          </p>
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Topic</label>
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={inputClass}>
              {CATEGORIES.map((c) => (
                <optgroup key={c.id} label={c.label}>
                  {c.topics.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          {isVerifiedExpert && (
            <div className="border-t border-[#E6E3DA] pt-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Briefcase size={13} className="text-[#217A78]" />
                <span className="text-[12px] font-semibold text-[#217A78]">Verified Expert perk: mention your practice</span>
              </div>
              <input value={promoLabel} onChange={(e) => setPromoLabel(e.target.value.slice(0, 70))} placeholder="e.g. I offer IEP advocacy consults — Bright Path Advocacy"
                className={`${inputClass} mb-2`} maxLength={70} />
              <input value={promoUrl} onChange={(e) => setPromoUrl(e.target.value)} placeholder="Link (optional)" className={inputClass} />
              <p className="text-[11px] text-[#9A968A] mt-1.5">One line, shown as a small tag on your post — not a full ad.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#E6E3DA] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-medium text-[#5B584F] hover:text-[#1C1B19]">Cancel</button>
          <button disabled={!canSubmit}
            onClick={async () => {
              setSaving(true);
              const promo = isVerifiedExpert && promoLabel.trim() ? { label: promoLabel.trim(), url: promoUrl.trim() || null } : null;
              await onSubmit({ title: title.trim(), body: body.trim(), topicId, state, promo, circleId });
              setSaving(false);
            }}
            className="px-4 py-2 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-2 hover:bg-[#1e2c3d] transition-colors">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
