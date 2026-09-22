import { ImageResponse } from "next/og";

export const alt = "Recess Forum — for parents navigating school";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F7F6F3", padding: 72, color: "#1C1B19" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: "#26364A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: "#B08D45" }} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#26364A" }}>Recess Forum</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.15 }}>A community for parents navigating school</div>
          <div style={{ display: "flex", fontSize: 30, color: "#5B584F" }}>
            Bullying, IEPs, homeschooling, college prep, and everything in between — from parents who&apos;ve been there.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#5B584F" }}>recessforum.com</div>
      </div>
    ),
    { ...size }
  );
}
