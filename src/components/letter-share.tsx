"use client";

import { useState, useSyncExternalStore } from "react";

function shareAvailable() {
  return typeof navigator.share === "function";
}

export function LetterShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const canShare = useSyncExternalStore(() => () => {}, shareAvailable, () => false);

  async function copy() {
    setError("");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
      setError("Select the link and copy it.");
    }
  }

  async function share() {
    setError("");
    try {
      await navigator.share({ title, url });
    } catch (event) {
      if (event instanceof DOMException && event.name === "AbortError") return;
      setError("Could not open the share sheet.");
    }
  }

  return (
    <div className="letter-share">
      <p className="kicker">Share this issue</p>
      <div>
        <input readOnly value={url} aria-label="Issue link" onFocus={(event) => event.currentTarget.select()} />
        <button type="button" onClick={copy}>
          {copied ? "Copied" : "Copy link"}
        </button>
        {canShare ? (
          <button type="button" onClick={share}>
            Share
          </button>
        ) : null}
      </div>
      {error ? <p className="letter-subscribe-error">{error}</p> : null}
    </div>
  );
}
