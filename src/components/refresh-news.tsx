"use client";

import { useState } from "react";

/** Admin control: asks for the news refresh password and refreshes the news desk now. */
export function RefreshNews() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function run(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/news-refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    setBusy(false);
    setPassword("");
    if (response?.ok) setMessage({ kind: "ok", text: "News refreshed. The News page shows the new pull on the next visit." });
    else if (response?.status === 401) setMessage({ kind: "err", text: "Wrong password." });
    else setMessage({ kind: "err", text: "Could not refresh right now." });
  }

  return (
    <section className="section" aria-labelledby="refresh-title">
      <h2 id="refresh-title">Refresh news now</h2>
      <p className="note">News refreshes on its own every morning at 6 AM ET. Use this for an extra pull.</p>
      <form className="studio-signin" onSubmit={run}>
        <label>
          Refresh password
          <input required type="password" value={password} autoComplete="off" onChange={(event) => setPassword(event.target.value)} />
        </label>
        <div className="studio-actions">
          <button className="go" type="submit" disabled={busy}>{busy ? "Refreshing…" : "Refresh news"}</button>
        </div>
      </form>
      {message ? <p className={`studio-msg ${message.kind}`}>{message.text}</p> : null}
    </section>
  );
}
