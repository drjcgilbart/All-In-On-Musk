"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChangePassword } from "@/components/change-password";

export function LoginDesk() {
  const router = useRouter();
  const [admin, setAdmin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [company, setCompany] = useState("");
  const [deskEmail, setDeskEmail] = useState("");
  const [deskPassword, setDeskPassword] = useState("");
  const [busy, setBusy] = useState<"join" | "desk" | null>(null);
  const [joinMsg, setJoinMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [deskMsg, setDeskMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/studio/auth", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setAdmin(Boolean(data?.authenticated)))
      .catch(() => setAdmin(false));
  }, []);

  async function requestMembership(event: React.FormEvent) {
    event.preventDefault();
    setBusy("join");
    setJoinMsg(null);
    try {
      const response = await fetch("/api/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, area, company }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Request failed");
      let message = data.message || "Request sent. The admin will review your free membership.";
      const waitingOnActivation = /activat/i.test(String(data.mailDetail || ""));
      if (!data.mailed && !waitingOnActivation) {
        const mailed = await fetch("https://formsubmit.co/ajax/admin@allinonmusk.com", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name,
            email,
            phone,
            area,
            message: `Free membership request for All In On Musk.\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "(none)"}\nCity / area: ${area || "(none)"}\nA password was set with this request and is not included in this email.`,
            _subject: `Free membership request from ${name}`,
            _replyto: email,
            _template: "table",
            _captcha: "false",
          }),
        });
        const mailData = await mailed.json().catch(() => ({}));
        const sent = mailed.ok && (mailData.success === true || mailData.success === "true");
        if (sent) {
          await fetch("/api/membership", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, detail: String(mailData.message || "Sent from the membership form.") }),
          }).catch(() => undefined);
          message = "Request sent. The admin will review your free membership.";
        } else if (/activat/i.test(String(mailData.message || ""))) {
          message = "Request saved. The admin will review your free membership.";
        } else {
          message = mailData.message || message;
        }
      }
      setJoinMsg({ kind: message.startsWith("Request") ? "ok" : "err", text: message });
      setPassword("");
    } catch (err) {
      setJoinMsg({ kind: "err", text: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setBusy(null);
    }
  }

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy("desk");
    setDeskMsg(null);
    try {
      const response = await fetch("/api/studio/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: deskEmail, password: deskPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      setDeskEmail("");
      setDeskPassword("");
      window.dispatchEvent(new Event("aim-auth"));
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setDeskMsg({ kind: "err", text: err instanceof Error ? err.message : "Could not sign in." });
      setBusy(null);
    }
  }

  return (
    <>
      <p className="kicker">Login</p>
      <h1 className="page-title">Come in.</h1>
      <p className="lede">Request a free membership, or sign in to the admin desk.</p>
      <div className="join-grid">
        <section className="join-card">
          <h2>Free membership</h2>
          <p className="note">The request goes to the admin. A membership request does not open the admin desk.</p>
          {joinMsg ? <p className={`join-msg ${joinMsg.kind}`}>{joinMsg.text}</p> : null}
          <form onSubmit={requestMembership}>
            <label>
              Full name
              <input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
            </label>
            <label>
              Email
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </label>
            <label>
              Password (min 8 characters)
              <input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
            </label>
            <label>
              Phone (optional)
              <input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
            </label>
            <label>
              City / area (optional)
              <input value={area} onChange={(event) => setArea(event.target.value)} />
            </label>
            <label className="honeypot">
              Company
              <input tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} />
            </label>
            <button className="go" type="submit" disabled={busy === "join"}>
              {busy === "join" ? "Sending…" : "Request membership"}
            </button>
          </form>
          <p className="note">The password stays with the request. It is not emailed.</p>
        </section>
        <section className="join-card">
          <h2>Admin desk</h2>
          {admin ? (
            <>
              <p className="note">
                You are signed in. <a href="/admin">Open the admin desk</a>
              </p>
              <ChangePassword />
            </>
          ) : (
            <p className="note">Sign in with your email address and password. This sign-in is only for the person who runs the desk.</p>
          )}
          {deskMsg ? <p className={`join-msg ${deskMsg.kind}`}>{deskMsg.text}</p> : null}
          <form onSubmit={signIn}>
            <label>
              Email
              <input required type="email" value={deskEmail} onChange={(event) => setDeskEmail(event.target.value)} autoComplete="username" />
            </label>
            <label>
              Password
              <input required type="password" value={deskPassword} onChange={(event) => setDeskPassword(event.target.value)} autoComplete="current-password" />
            </label>
            <button className="go" type="submit" disabled={busy === "desk"}>
              {busy === "desk" ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
