"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChangePassword } from "@/components/change-password";
import type { Album, Clip, Story, StoryImage, StudioCatalog } from "@/lib/studio/types";
import "./studio.css";

type Kind = "story" | "album" | "clip";

const emptyStory = { title: "", slug: "", excerpt: "", body: "", tags: "", images: [] as StoryImage[], featuredImageId: "" };
const emptyAlbum = { title: "", slug: "", caption: "", tags: "", images: [] as StoryImage[], featuredImageId: "" };
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
  const [kind, setKind] = useState<Kind>("story");
  const [catalog, setCatalog] = useState<StudioCatalog | null>(initialCatalog);
  const [story, setStory] = useState(emptyStory);
  const [album, setAlbum] = useState(emptyAlbum);
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

  async function uploadFiles(list: FileList | null, target: "story" | "album") {
    if (!list?.length) return;
    setBusy(true);
    setMessage(null);
    const added: StoryImage[] = [];
    for (const file of Array.from(list)) {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/studio/upload", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ kind: "err", text: data.error || "Upload failed." });
        break;
      }
      added.push({ id: data.id, url: data.url, caption: "" });
    }
    if (target === "story") {
      setStory((current) => ({
        ...current,
        images: [...current.images, ...added],
        featuredImageId: current.featuredImageId || added[0]?.id || "",
      }));
    } else {
      setAlbum((current) => ({
        ...current,
        images: [...current.images, ...added],
        featuredImageId: current.featuredImageId || added[0]?.id || "",
      }));
    }
    setBusy(false);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const item = kind === "story"
      ? { ...story, tags: story.tags }
      : kind === "album"
        ? { ...album, tags: album.tags }
        : { ...clip, tags: clip.tags };
    const response = await fetch("/api/studio/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, id: editing, item }),
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
    setStory(emptyStory);
    setAlbum(emptyAlbum);
    setClip(emptyClip);
    setMessage({ kind: "ok", text: wasEdit ? "Saved." : "Published." });
  }

  async function remove(itemKind: Kind, id: string) {
    if (!window.confirm("Remove this page from the site?")) return;
    const response = await fetch(`/api/studio/content?kind=${itemKind}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage({ kind: "err", text: data.error || "Could not remove it." });
      return;
    }
    setCatalog(data.catalog);
    if (editing === id) {
      setEditing("");
      setStory(emptyStory);
      setAlbum(emptyAlbum);
      setClip(emptyClip);
    }
  }

  function editStory(row: Story) {
    setKind("story");
    setEditing(row.id);
    setStory({
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      body: row.body,
      tags: row.tags.join(", "),
      images: row.images,
      featuredImageId: row.featuredImageId || row.images[0]?.id || "",
    });
  }

  function editAlbum(row: Album) {
    setKind("album");
    setEditing(row.id);
    setAlbum({
      title: row.title,
      slug: row.slug,
      caption: row.caption,
      tags: row.tags.join(", "),
      images: row.images,
      featuredImageId: row.featuredImageId || row.images[0]?.id || "",
    });
  }

  function editClip(row: Clip) {
    setKind("clip");
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
        <p className="lede">Sign in with your email address and password. Creator Studio publishes stories, pictures, and videos on this desk.</p>
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
        <p className="lede">Creator Studio is where a story, a picture page, or a video goes live.</p>
        <div className="studio-actions">
          <a href="/studio">Open Creator Studio</a>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
        <ChangePassword />
        <p className="piece-links">
          <a href="/journal">Journal</a>
          <a href="/pictures">Pictures</a>
          <a href="/watch">Videos</a>
        </p>
      </>
    );
  }

  const images = kind === "story" ? story.images : album.images;
  const featured = kind === "story" ? story.featuredImageId : album.featuredImageId;

  return (
    <>
      <p className="kicker">Creator Studio</p>
      <h1 className="page-title">{editing ? "Edit a page." : "Add a page."}</h1>
      <p className="lede">A story lands in Journal. Pictures and videos get their own pages.</p>
      <div className="studio-actions">
        <a href="/admin">Admin</a>
        <button type="button" onClick={signOut}>Sign out</button>
      </div>
      <div className="studio-tabs" role="group" aria-label="Page type">
        {(["story", "album", "clip"] as Kind[]).map((item) => (
          <button
            key={item}
            type="button"
            className={kind === item ? "is-on" : ""}
            aria-pressed={kind === item}
            onClick={() => {
              setKind(item);
              setEditing("");
            }}
          >
            {item === "story" ? "Blog" : item === "album" ? "Pictures" : "Video"}
          </button>
        ))}
      </div>
      <form className="studio-form" onSubmit={save}>
        {kind === "story" ? (
          <>
            <label>Title<input value={story.title} onChange={(event) => setStory({ ...story, title: event.target.value })} required /></label>
            <label>Slug<input value={story.slug} onChange={(event) => setStory({ ...story, slug: event.target.value })} placeholder="Filled from the title if blank" /></label>
            <label>Excerpt<textarea value={story.excerpt} onChange={(event) => setStory({ ...story, excerpt: event.target.value })} /></label>
            <label>Story<textarea value={story.body} onChange={(event) => setStory({ ...story, body: event.target.value })} /></label>
            <label>Tags<input value={story.tags} onChange={(event) => setStory({ ...story, tags: event.target.value })} placeholder="comma separated" /></label>
          </>
        ) : null}
        {kind === "album" ? (
          <>
            <label>Title<input value={album.title} onChange={(event) => setAlbum({ ...album, title: event.target.value })} required /></label>
            <label>Slug<input value={album.slug} onChange={(event) => setAlbum({ ...album, slug: event.target.value })} placeholder="Filled from the title if blank" /></label>
            <label>Caption<textarea value={album.caption} onChange={(event) => setAlbum({ ...album, caption: event.target.value })} /></label>
            <label>Tags<input value={album.tags} onChange={(event) => setAlbum({ ...album, tags: event.target.value })} placeholder="comma separated" /></label>
          </>
        ) : null}
        {kind === "clip" ? (
          <>
            <label>Title<input value={clip.title} onChange={(event) => setClip({ ...clip, title: event.target.value })} required /></label>
            <label>Slug<input value={clip.slug} onChange={(event) => setClip({ ...clip, slug: event.target.value })} placeholder="Filled from the title if blank" /></label>
            <label>YouTube link<input value={clip.youtubeUrl} onChange={(event) => setClip({ ...clip, youtubeUrl: event.target.value })} placeholder="https://www.youtube.com/watch?v=..." required /></label>
            <label>Description<textarea value={clip.description} onChange={(event) => setClip({ ...clip, description: event.target.value })} /></label>
            <label>Tags<input value={clip.tags} onChange={(event) => setClip({ ...clip, tags: event.target.value })} placeholder="comma separated" /></label>
          </>
        ) : null}
        {kind !== "clip" ? (
          <label>
            Pictures
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => uploadFiles(event.target.files, kind)} />
          </label>
        ) : null}
        {kind !== "clip" && images.length ? (
          <div className="studio-shots">
            {images.map((image) => (
              <figure key={image.id}>
                <img src={image.url} alt="" />
                <input
                  value={image.caption || ""}
                  placeholder="Caption"
                  onChange={(event) => {
                    const caption = event.target.value;
                    const next = images.map((row) => (row.id === image.id ? { ...row, caption } : row));
                    if (kind === "story") setStory({ ...story, images: next });
                    else setAlbum({ ...album, images: next });
                  }}
                />
                <label>
                  <input
                    type="radio"
                    name="cover"
                    checked={featured === image.id}
                    onChange={() => {
                      if (kind === "story") setStory({ ...story, featuredImageId: image.id });
                      else setAlbum({ ...album, featuredImageId: image.id });
                    }}
                  />
                  Cover
                </label>
                {kind === "story" ? (
                  <button
                    type="button"
                    onClick={() => setStory({ ...story, body: `${story.body.trim()}\n\n[[photo:${image.id}]]\n\n`.trim() })}
                  >
                    Place in story
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    const next = images.filter((row) => row.id !== image.id);
                    const nextCover = featured === image.id ? next[0]?.id || "" : featured;
                    if (kind === "story") setStory({ ...story, images: next, featuredImageId: nextCover });
                    else setAlbum({ ...album, images: next, featuredImageId: nextCover });
                  }}
                >
                  Remove picture
                </button>
              </figure>
            ))}
          </div>
        ) : null}
        <div className="studio-actions">
          <button className="go" type="submit" disabled={busy}>{editing ? "Save changes" : "Publish"}</button>
          {editing ? (
            <button
              type="button"
              onClick={() => {
                setEditing("");
                setStory(emptyStory);
                setAlbum(emptyAlbum);
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
            {catalog.stories.map((row) => (
              <article className="plain-card" key={row.id}>
                <p className="idx">Blog</p>
                <h3>{row.title}</h3>
                <div className="studio-row">
                  <a href={`/journal/${row.slug}`}>View</a>
                  <button type="button" onClick={() => editStory(row)}>Edit</button>
                  <button type="button" onClick={() => remove("story", row.id)}>Remove</button>
                </div>
              </article>
            ))}
            {catalog.albums.map((row) => (
              <article className="plain-card" key={row.id}>
                <p className="idx">Pictures</p>
                <h3>{row.title}</h3>
                <div className="studio-row">
                  <a href={`/pictures/${row.slug}`}>View</a>
                  <button type="button" onClick={() => editAlbum(row)}>Edit</button>
                  <button type="button" onClick={() => remove("album", row.id)}>Remove</button>
                </div>
              </article>
            ))}
            {catalog.clips.map((row) => (
              <article className="plain-card" key={row.id}>
                <p className="idx">Video</p>
                <h3>{row.title}</h3>
                <div className="studio-row">
                  <a href={`/watch/${row.slug}`}>View</a>
                  <button type="button" onClick={() => editClip(row)}>Edit</button>
                  <button type="button" onClick={() => remove("clip", row.id)}>Remove</button>
                </div>
              </article>
            ))}
            {!catalog.stories.length && !catalog.albums.length && !catalog.clips.length ? <p className="note">Nothing published yet.</p> : null}
          </div>
        )}
      </section>
    </>
  );
}
