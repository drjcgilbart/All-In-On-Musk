"use client";

import type { CSSProperties } from "react";
import { trackDownloadClick } from "./ga";

const ZIP = "/downloads/florida-fleet-model-v1.1.zip";

const downloadBtnStyle: CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  minHeight: 52,
  height: "auto",
  padding: "0.95rem 1rem",
  textAlign: "center",
  borderColor: "var(--desk-line-hot, #2ee6d6b8)",
  background: "rgba(46, 230, 214, 0.12)",
  color: "#2ee6d6",
  whiteSpace: "normal",
  marginBottom: "0.35rem",
};

type Props = {
  location: "top" | "bottom";
  wrapStyle?: CSSProperties;
};

/** Same markup/styling as before; onClick never preventDefault. */
export function DownloadCta({ location, wrapStyle }: Props) {
  return (
    <p style={wrapStyle}>
      <a
        className="nav-btn"
        href={ZIP}
        download
        type="application/zip"
        style={downloadBtnStyle}
        onClick={() => trackDownloadClick(location)}
      >
        Download free Excel (v1.1)
      </a>
    </p>
  );
}
