"use client";

import { useState } from "react";

export function LetterUnsubscribe({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [showEmail, setShowEmail] = useState(!token);
  const [busy, setBusy] = useState(false);

  async function post(body: { token?: string; email?: string }) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/letter/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(payload.error || "Could not unsubscribe. Try again.");
        if (body.token) setShowEmail(true);
        setBusy(false);
        return;
      }
      setMessage(payload.message || "You're off the list.");
      setShowEmail(false);
    } catch {
      setMessage("Could not unsubscribe. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="letter-subscribe">
      {token && !showEmail ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void post({ token });
          }}
        >
          <p>This removes the address tied to this link.</p>
          <button className="letter-cta" type="submit" disabled={busy}>
            {busy ? "Removing" : "Unsubscribe"}
          </button>
        </form>
      ) : null}
      {showEmail ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void post({ email: String(data.get("email") || "") });
          }}
        >
          <label className="letter-field email">
            <span className="sr">Email</span>
            <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="Email" />
          </label>
          <button className="letter-cta" type="submit" disabled={busy}>
            {busy ? "Removing" : "Unsubscribe"}
          </button>
        </form>
      ) : null}
      {message ? <p className="letter-subscribe-done" role="status">{message}</p> : null}
    </div>
  );
}
