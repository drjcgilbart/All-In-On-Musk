"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChangePassword } from "@/components/change-password";
import type { Clip, StudioCatalog } from "@/lib/studio/types";
import "./studio.css";

/** Blog stories and picture pages are retired from the admin UI. Stored stories/albums are left untouched in the catalog. */
const emptyClip = { title: "", slug: "", description: "", youtubeUrl: "", tags: "" };

export function StudioClient({
  authed,
  mode,
  initialCatalog = null,
}: {
  authed: boolean;
  mode: "admin" | "studio";
  initialCatalog?: StudioCatalog | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [catalog, setCatalog] = useState<StudioCatalog | null>(initialCatalog);
  const [clip, setClip] = useState(emptyClip);
  const [editing, setEditing] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authed || mode !== "studio") return;
    let gone = false;
    fetch("/api/studio/content", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || !Array.isArray(data.stories)) {
          throw new Error(data?.error || "Could not load the desk.");
        }
        if (!gone) setCatalog(data);
      })
      .catch((error: unknown) => {
        if (!gone) setMessage({ kind: "err", text: error instanceof Error ? error.message : "Could not load the desk." });
      });
    return () => {
      gone = true;
    };
  }, [authed, mode]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/studio/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage({ kind: "err", text: data.error || "Could not sign in." });
      return;
    }
    setEmail("");
    setPassword("");
    window.dispatchEvent(new Event("aim-auth"));
    router.refresh();
  }

  async function signOut() {
    await fetch("/api/studio/auth", { method: "DELETE" });
    window.dispatchEvent(new Event("aim-auth"));
    router.refresh();
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/studio/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "clip", id: editing, item: { ...clip, tags: clip.tags } }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage({ kind: "err", text: data.error || "Could not publish." });
      return;
    }
    const wasEdit = Boolean(editing);
    setCatalog(data.catalog);
    setEditing("");
    setClip(emptyClip);
    setMessage({ kind: "ok", text: wasEdit ? "Saved." : "Published." });
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this video from the site?")) return;
    const response = await fetch(`/api/studio/content?kind=clip&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage({ kind: "err", text: data.error || "Could not remove it." });
      return;
    }
    setCatalog(data.catalog);
    if (editing === id) {
      setEditing("");
      setClip(emptyClip);
    }
  }

  function editClip(row: Clip) {
    setEditing(row.id);
    setClip({
      title: row.title,
      slug: row.slug,
      description: row.description,
      youtubeUrl: row.youtubeId ? `https://www.youtube.com/watch?v=${row.youtubeId}` : "",
      tags: row.tags.join(", "),
    });
  }

  if (!authed) {
    return (
      <>
        <p className="kicker">Admin</p>
        <h1 className="page-title">Sign in.</h1>
        <p className="lede">Sign in with your email address and password. Creator Studio publishes videos to the video block at the top of News.</p>
        <form className="studio-signin" onSubmit={signIn}>
          <label>
            Email
            <input required type="email" value={email} autoComplete="username" onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input required type="password" value={password} autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} />
          </label>
          <div className="studio-actions">
            <button className="go" type="submit" disabled={busy}>Sign in</button>
          </div>
        </form>
        {message ? <p className={`studio-msg ${message.kind}`}>{message.text}</p> : null}
      </>
    );
  }

  if (mode === "admin") {
    return (
      <>
        <p className="kicker">Admin</p>
        <h1 className="page-title">Desk controls.</h1>
        <p className="lede">Creator Studio is where a video goes live. Videos show in the block at the top of News, newest first, alongside the latest uploads from the YouTube channel.</p>
        <div className="studio-actions">
          <a href="/studio">Open Creator Studio</a>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
        <ChangePassword />
        <p className="piece-links">
          <a href="/news">News</a>
          <a href="/watch">Videos</a>
        </p>
      </>
    );
  }

  return (
    <>
      <p className="kicker">Creator Studio</p>
      <h1 className="page-title">{editing ? "Edit a video." : "Add a video."}</h1>
      <p className="lede">The journal is now part of News: videos added here appear in the video block at the top of the News page, mixed with the latest YouTube uploads, newest first. There is no blog or pictures section.</p>
      <div className="studio-actions">
        <a href="/admin">Admin</a>
        <button type="button" onClick={signOut}>Sign out</button>
      </div>
      <form className="studio-form" onSubmit={save}>
            <label>Title<input value={clip.title} onChange={(event) => setClip({ ...clip, title: event.target.value })} required /></label>
            <label>Slug<input value={clip.slug} onChange={(event) => setClip({ ...clip, slug: event.target.value })} placeholder="Filled from the title if blank" /></label>
            <label>YouTube link<input value={clip.youtubeUrl} onChange={(event) => setClip({ ...clip, youtubeUrl: event.target.value })} placeholder="https://www.youtube.com/watch?v=..." required /></label>
            <label>Description<textarea value={clip.description} onChange={(event) => setClip({ ...clip, description: event.target.value })} /></label>
            <label>Tags<input value={clip.tags} onChange={(event) => setClip({ ...clip, tags: event.target.value })} placeholder="comma separated" /></label>
        <div className="studio-actions">
          <button className="go" type="submit" disabled={busy}>{editing ? "Save changes" : "Publish"}</button>
          {editing ? (
            <button
              type="button"
              onClick={() => {
                setEditing("");
                setClip(emptyClip);
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
      {message ? <p className={`studio-msg ${message.kind}`}>{message.text}</p> : null}
      <section className="section">
        <h2>On the site</h2>
        {!catalog ? <p className="note">Loading.</p> : (
          <div className="studio-list">
            {catalog.clips.map((row) => (
              <article className="plain-card" key={row.id}>
                <p className="idx">Video</p>
                <h3>{row.title}</h3>
                <div className="studio-row">
                  <a href={`/watch/${row.slug}`}>View</a>
                  <button type="button" onClick={() => editClip(row)}>Edit</button>
                  <button type="button" onClick={() => remove(row.id)}>Remove</button>
                </div>
              </article>
            ))}
            {!catalog.clips.length ? <p className="note">No videos published yet.</p> : null}
          </div>
        )}
      </section>
    </>
  );
}
