import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "All In On Musk";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#05060a",
          color: "#f4fbff",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, color: "#2ee7ff" }}>
          FAN PAGE
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 108, lineHeight: 0.9, fontWeight: 700 }}>
          <div style={{ display: "flex" }}>ALL IN</div>
          <div style={{ display: "flex", color: "#ff2bd6" }}>ON MUSK</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#2ee7ff" }}>allinonmusk.com</div>
      </div>
    ),
    { ...size },
  );
}
