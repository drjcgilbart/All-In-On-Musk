"use client";

import { useState } from "react";

export function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
    setError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      if (newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
      if (newPassword !== confirm) throw new Error("New password and confirmation do not match.");
      const response = await fetch("/api/studio/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword, confirm }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not change password.");
      resetForm();
      setOpen(false);
      setOk(data.message || "Password updated.");
      window.dispatchEvent(new Event("aim-auth"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="desk-password" id="change-password">
      <h2>Change my password</h2>
      <p className="note">Updates the admin desk sign-in. Nothing else is deleted.</p>
      {ok ? <p className="join-msg ok">{ok}</p> : null}
      {!open ? (
        <button
          type="button"
          className="go"
          onClick={() => {
            setOpen(true);
            setOk(null);
            setError(null);
          }}
        >
          Change my password
        </button>
      ) : (
        <form onSubmit={(event) => void submit(event)}>
          <label htmlFor="desk-pw-current">
            Current password
            <input
              id="desk-pw-current"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label htmlFor="desk-pw-new">
            New password
            <input
              id="desk-pw-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          <label htmlFor="desk-pw-confirm">
            Confirm new password
            <input
              id="desk-pw-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              minLength={8}
              required
            />
          </label>
          {error ? <p className="join-msg err">{error}</p> : null}
          <div className="row-actions">
            <button type="submit" className="go" disabled={busy}>
              {busy ? "Saving…" : "Save new password"}
            </button>
            <button
              type="button"
              className="quiet"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
