"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export function LoginRequiredModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(28,27,25,0.55)" }}>
      <div className="w-full max-w-sm bg-[#F7F6F3] border border-[#E6E3DA]">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E6E3DA]">
          <h2 className="text-[15px] font-semibold text-[#1C1B19]">Sign in required</h2>
          <button onClick={onClose} className="text-[#9A968A] hover:text-[#1C1B19]"><X size={17} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <p className="text-[13px] text-[#5B584F]">Log in or create an account to use this feature.</p>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-3.5 py-2 text-[13px] font-medium text-[#5B584F] hover:text-[#1C1B19] transition-colors">Cancel</button>
            <button onClick={() => router.push("/login")} className="px-3.5 py-2 text-[13px] font-semibold bg-[#26364A] text-white hover:bg-[#1e2c3d] transition-colors">Log in</button>
          </div>
        </div>
      </div>
    </div>
  );
}
