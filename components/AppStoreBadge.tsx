"use client";

import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";

export const APP_STORE_URL = "https://apps.apple.com/us/app/recess-forum/id6812074278";

// Apple's official badge, served by Apple Marketing Tools (don't redraw it).
const BADGE_SRC = "https://toolbox.marketingtools.apple.com/api/badges/download-on-the-app-store/black/en-us?size=250x83";

/** "Download on the App Store" badge for the website. Hidden inside the native app. */
export function AppStoreBadge({ height = 40, showAndroid = true }: { height?: number; showAndroid?: boolean }) {
  // Capacitor is only known in the browser; render nothing on the server and inside the app.
  const isWebBrowser = useSyncExternalStore(() => () => {}, () => !Capacitor.isNativePlatform(), () => false);
  if (!isWebBrowser) return null;
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label="Download Recess Forum on the App Store">
        {/* eslint-disable-next-line @next/next/no-img-element -- official Apple badge, external asset */}
        <img src={BADGE_SRC} alt="Download on the App Store" style={{ height, width: "auto" }} />
      </a>
      {showAndroid && <span className="text-[12px] text-[#9A968A]">Android app coming soon</span>}
    </div>
  );
}
