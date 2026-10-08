import { NextResponse } from "next/server";
import { studioRequestAuthenticated } from "@/lib/studio/auth";
import {
  albumFromInput,
  clipFromInput,
  readCatalog,
  storyFromInput,
  writeCatalog,
} from "@/lib/studio/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authed(request: Request) {
  return studioRequestAuthenticated(request);
}

export async function GET(request: Request) {
  if (!(await authed(request))) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  return NextResponse.json(await readCatalog());
}

export async function POST(request: Request) {
  if (!(await authed(request))) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const kind = body && typeof body === "object" ? String((body as { kind?: string }).kind || "") : "";
  const item = body && typeof body === "object" ? (body as { item?: unknown }).item : null;
  const existingId = body && typeof body === "object" ? String((body as { id?: string }).id || "") : "";
  try {
    const catalog = await readCatalog();
    if (kind === "story") {
      const story = storyFromInput(item, catalog, existingId || undefined);
      catalog.stories = [story, ...catalog.stories.filter((row) => row.id !== story.id)];
    } else if (kind === "clip") {
      const clip = clipFromInput(item, catalog, existingId || undefined);
      catalog.clips = [clip, ...catalog.clips.filter((row) => row.id !== clip.id)];
    } else if (kind === "album") {
      const album = albumFromInput(item, catalog, existingId || undefined);
      catalog.albums = [album, ...catalog.albums.filter((row) => row.id !== album.id)];
    } else {
      return NextResponse.json({ error: "Unknown page type." }, { status: 400 });
    }
    await writeCatalog(catalog);
    return NextResponse.json({ ok: true, catalog });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await authed(request))) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") || "";
  const id = url.searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const catalog = await readCatalog();
  if (kind === "story") catalog.stories = catalog.stories.filter((row) => row.id !== id);
  else if (kind === "clip") catalog.clips = catalog.clips.filter((row) => row.id !== id);
  else if (kind === "album") catalog.albums = catalog.albums.filter((row) => row.id !== id);
  else return NextResponse.json({ error: "Unknown page type." }, { status: 400 });
  try {
    await writeCatalog(catalog);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, catalog });
}
