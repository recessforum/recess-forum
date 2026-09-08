"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { EXPERT_TYPES } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES: Record<string, true> = {
  "application/pdf": true,
  "image/jpeg": true,
  "image/png": true,
};

export function ExpertApplicationModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: { expertType: string; credentialInfo: string; filePath: string | null }) => Promise<void>;
}) {
  const { profile } = useAuth();
  const [expertType, setExpertType] = useState(EXPERT_TYPES[0]);
  const [credentialInfo, setCredentialInfo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const inputClass = "w-full px-3 py-2.5 border border-[#E6D9C4] bg-white text-[14px] outline-none focus:border-[#26364A] transition-colors";
  const canSubmit = credentialInfo.trim() && !saving;

  const handleFileChange = (f: File | undefined) => {
    if (!f) {
      setFile(null);
      setFileError(null);
      return;
    }
    if (!ALLOWED_TYPES[f.type]) {
      setFile(null);
      setFileError("Only PDF, JPG, or PNG files are accepted.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setFile(null);
      setFileError("File is too large (10MB max).");
      return;
    }
    setFile(f);
    setFileError(null);
  };

  const handleSubmit = async () => {
    if (!profile) return;
    setSaving(true);

    let filePath: string | null = null;
    if (file) {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const safeExt = ext && /^[a-zA-Z0-9]+$/.test(ext) ? `.${ext}` : "";
      filePath = `${profile.id}/${Date.now()}${safeExt}`;
      const { error } = await supabase.storage.from("expert-credentials").upload(filePath, file);
      if (error) {
        setFileError(error.message);
        setSaving(false);
        return;
      }
    }

    await onSubmit({ expertType, credentialInfo: credentialInfo.trim(), filePath });
    setSaving(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(28,27,25,0.55)" }}>
        <div className="w-full max-w-sm p-6 text-center" style={{ backgroundColor: "#FDF1E5", border: "1px solid #F0C99B" }}>
          <CheckCircle2 size={32} className="text-[#217A78] mx-auto mb-3" />
          <h2 className="text-[16px] font-semibold text-[#1C1B19] mb-1.5">Application submitted</h2>
          <p className="text-[13px] text-[#5B584F] mb-5">We&apos;ll review it and follow up. Verified Expert badges are typically approved within a few business days.</p>
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-semibold bg-[#26364A] text-white hover:bg-[#1e2c3d] transition-colors">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(28,27,25,0.55)" }}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "#FDF1E5", border: "1px solid #F0C99B" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F0C99B" }}>
          <div>
            <h2 className="text-[17px] font-semibold text-[#1C1B19]">Apply as a Verified Expert</h2>
            <p className="text-[12px] text-[#9A968A] mt-0.5">Applying as {profile?.display_name}</p>
          </div>
          <button onClick={onClose} className="text-[#9A968A] hover:text-[#1C1B19]"><X size={18} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <p className="text-[13px] text-[#5B584F] -mt-1">
            Verified Experts get a credibility badge and limited rights to mention their practice on posts. Review is manual — keep it brief.
          </p>
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Area of expertise</label>
            <select value={expertType} onChange={(e) => setExpertType(e.target.value)} className={inputClass}>
              {EXPERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">Credential (license #, certifying body, or employer)</label>
            <input value={credentialInfo} onChange={(e) => setCredentialInfo(e.target.value)} placeholder="e.g. CA Bar #123456, or 'Speech-Language Pathologist, ABC School District'" className={inputClass} />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#5B584F] block mb-1.5">
              Upload proof <span className="text-[#9A968A] font-normal">(license, certification, or ID — optional but speeds up review)</span>
            </label>
            <label className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-[#5B584F] cursor-pointer" style={{ border: "1px dashed #E3B37C", backgroundColor: "#FBF9F5" }}>
              <Upload size={15} />
              {file?.name || "Choose a file"}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0])} />
            </label>
            {fileError && <p className="text-[12px] text-[#B23B3B] mt-1.5">{fileError}</p>}
            <p className="text-[11px] text-[#9A968A] mt-1.5">PDF, JPG, or PNG — 10MB max.</p>
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: "1px solid #F0C99B" }}>
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-medium text-[#5B584F] hover:text-[#1C1B19]">Cancel</button>
          <button disabled={!canSubmit} onClick={handleSubmit}
            className="px-4 py-2 text-[14px] font-semibold bg-[#26364A] text-white disabled:opacity-40 flex items-center gap-2 hover:bg-[#1e2c3d] transition-colors">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Submit application
          </button>
        </div>
      </div>
    </div>
  );
}
