"use client";

import { useState, type FormEvent } from "react";
import { LETTER_CONTACT_EMAIL } from "@/content/letter";

export function LetterSubscribeForm({ compact = false }: { compact?: boolean }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/letter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          name: data.get("name"),
          company: data.get("company"),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(body.error || "Could not subscribe. Try again.");
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Could not subscribe. Try again.");
      setBusy(false);
    }
  }

  return (
    <section className={compact ? "letter-subscribe compact" : "letter-subscribe"} aria-label="Subscribe">
      {done ? (
        <p className="letter-subscribe-done" role="status">
          You&apos;re on the list.
        </p>
      ) : (
        <form onSubmit={onSubmit}>
          <div className="letter-hp" aria-hidden="true">
            <label>
              Company
              <input name="company" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <label className="letter-field name">
            <span>Name <span className="letter-optional">optional</span></span>
            <input name="name" maxLength={80} autoComplete="name" />
          </label>
          <label className="letter-field email">
            <span className="sr">Email</span>
            <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="Email" />
          </label>
          <button className="letter-cta" type="submit" disabled={busy}>
            {busy ? "Subscribing" : "Subscribe"}
          </button>
          {error ? <p className="letter-subscribe-error" role="alert">{error}</p> : null}
        </form>
      )}
      <p className="letter-privacy">
        Free. Unsubscribe anytime. We store your email, an optional name, and the signup date. Used only for this letter.
        Questions: <a href={`mailto:${LETTER_CONTACT_EMAIL}`}>{LETTER_CONTACT_EMAIL}</a>.
      </p>
    </section>
  );
}
