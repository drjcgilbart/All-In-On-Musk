import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Album, Clip, Story, StoryImage, StudioCatalog } from "./types";

const LOCAL_FILE = path.join(process.cwd(), "data", "studio.json");
const BLOB_PATH = "studio/catalog.json";

export function emptyCatalog(): StudioCatalog {
  return { stories: [], clips: [], albums: [], updatedAt: null };
}

export function slugify(text: string) {
  const slug = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "page";
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
}

function acceptYouTubeId(id: string) {
  return /^[\w-]{11}$/.test(id) ? id : "";
}

export function extractYouTubeId(input: string) {
  const raw = input.trim();
  if (!raw) return "";
  if (/^[\w-]{11}$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtu.be")) return acceptYouTubeId(url.pathname.slice(1).split("/")[0] || "");
    if (url.hostname.includes("youtube.com") || url.hostname === "youtube-nocookie.com") {
      const watch = url.searchParams.get("v");
      if (watch) return acceptYouTubeId(watch);
      const parts = url.pathname.split("/").filter(Boolean);
      const marker = parts.findIndex((part) => part === "embed" || part === "shorts");
      if (marker >= 0 && parts[marker + 1]) return acceptYouTubeId(parts[marker + 1]);
    }
  } catch {
    return "";
  }
  return "";
}

function cleanTags(value: unknown) {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  const tags: string[] = [];
  for (const item of source) {
    const tag = String(item || "").trim().replace(/\s+/g, " ").slice(0, 32);
    if (!tag || tags.includes(tag)) continue;
    tags.push(tag);
    if (tags.length >= 12) break;
  }
  return tags;
}

function cleanImages(value: unknown): StoryImage[] {
  if (!Array.isArray(value)) return [];
  const images: StoryImage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as StoryImage;
    const url = String(row.url || "").trim();
    if (!url.startsWith("https://") && !url.startsWith("/studio-uploads/")) continue;
    images.push({
      id: String(row.id || newId("img")).slice(0, 40),
      url: url.slice(0, 500),
      caption: String(row.caption || "").trim().slice(0, 180),
    });
    if (images.length >= 12) break;
  }
  return images;
}

function uniqueSlug(wanted: string, taken: Set<string>) {
  const base = slugify(wanted);
  if (!taken.has(base)) return base;
  for (let n = 2; n < 100; n++) {
    const next = `${base}-${n}`.slice(0, 80);
    if (!taken.has(next)) return next;
  }
  return `${base}-${newId("x").slice(-6)}`;
}

export function normalizeCatalog(raw: unknown): StudioCatalog {
  const data = raw && typeof raw === "object" ? (raw as Partial<StudioCatalog>) : {};
  return {
    stories: Array.isArray(data.stories) ? data.stories.filter((item) => item && item.slug && item.title) : [],
    clips: Array.isArray(data.clips) ? data.clips.filter((item) => item && item.slug && item.title) : [],
    albums: Array.isArray(data.albums) ? data.albums.filter((item) => item && item.slug && item.title) : [],
    updatedAt: data.updatedAt || null,
  };
}

function blobReady() {
  return Boolean(process.env.UPSTASH_BLOB_TOKEN);
}

async function upstash() {
  const { Bucket } = await import("@upstash/blob");
  return Bucket.fromEnv();
}

function productionHost() {
  return process.env.VERCEL === "1";
}

async function readLocal(): Promise<StudioCatalog> {
  try {
    const text = await readFile(LOCAL_FILE, "utf8");
    return normalizeCatalog(JSON.parse(text));
  } catch {
    return emptyCatalog();
  }
}

async function writeLocal(catalog: StudioCatalog) {
  await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(catalog, null, 2));
}

async function readBlob(): Promise<StudioCatalog> {
  try {
    const file = await (await upstash()).get(BLOB_PATH);
    return normalizeCatalog(JSON.parse(await new Response(file.body).text()));
  } catch {
    return emptyCatalog();
  }
}

async function writeBlob(catalog: StudioCatalog) {
  await (await upstash()).put(BLOB_PATH, JSON.stringify(catalog), {
    contentType: "application/json",
    cache: 60,
  });
}

export async function readCatalog() {
  if (blobReady()) return readBlob();
  if (productionHost()) return emptyCatalog();
  return readLocal();
}

export async function writeCatalog(catalog: StudioCatalog) {
  catalog.updatedAt = new Date().toISOString();
  if (blobReady()) {
    await writeBlob(catalog);
    return catalog;
  }
  if (productionHost()) {
    throw new Error("Studio storage is not configured on this host.");
  }
  await writeLocal(catalog);
  return catalog;
}

export async function saveUpload(file: File) {
  const type = file.type;
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(type)) throw new Error("Use a JPEG, PNG, WebP, or GIF.");
  if (file.size > 8 * 1024 * 1024) throw new Error("That picture is over 8 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : type === "image/gif" ? "gif" : "jpg";
  const name = `${createHash("sha1").update(bytes).digest("hex").slice(0, 12)}-${Date.now().toString(36)}.${ext}`;
  if (blobReady()) {
    const blob = await (await upstash()).put(`studio/media/${name}`, bytes, {
      contentType: type,
      cache: "immutable",
    });
    if (!blob.url) throw new Error("Picture storage is private. The bucket has to be public.");
    return blob.url;
  }
  if (productionHost()) throw new Error("Picture storage is not configured on this host.");
  const dir = path.join(process.cwd(), "public", "studio-uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return `/studio-uploads/${name}`;
}

function text(value: unknown, max: number) {
  return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

export function storyFromInput(input: unknown, catalog: StudioCatalog, existingId?: string): Story {
  const row = (input || {}) as Partial<Story>;
  const title = text(row.title, 140);
  if (!title) throw new Error("A story needs a title.");
  const taken = new Set(catalog.stories.filter((item) => item.id !== existingId).map((item) => item.slug));
  const images = cleanImages(row.images);
  const featured = images.some((image) => image.id === row.featuredImageId) ? row.featuredImageId : images[0]?.id;
  const previous = catalog.stories.find((item) => item.id === existingId);
  return {
    id: existingId || newId("story"),
    title,
    slug: uniqueSlug(text(row.slug, 80) || title, taken),
    excerpt: text(row.excerpt, 280),
    body: text(row.body, 40000),
    images,
    featuredImageId: featured,
    publishedAt: previous?.publishedAt || new Date().toISOString(),
    tags: cleanTags(row.tags),
  };
}

export function clipFromInput(input: unknown, catalog: StudioCatalog, existingId?: string): Clip {
  const row = (input || {}) as Partial<Clip> & { youtubeUrl?: string };
  const title = text(row.title, 140);
  if (!title) throw new Error("A video needs a title.");
  const youtubeId = extractYouTubeId(String(row.youtubeId || row.youtubeUrl || ""));
  if (!youtubeId) throw new Error("Paste a YouTube link.");
  const taken = new Set(catalog.clips.filter((item) => item.id !== existingId).map((item) => item.slug));
  const previous = catalog.clips.find((item) => item.id === existingId);
  return {
    id: existingId || newId("clip"),
    title,
    slug: uniqueSlug(text(row.slug, 80) || title, taken),
    description: text(row.description, 2000),
    youtubeId,
    thumbnailUrl: text(row.thumbnailUrl, 500),
    publishedAt: previous?.publishedAt || new Date().toISOString(),
    tags: cleanTags(row.tags),
  };
}

export function albumFromInput(input: unknown, catalog: StudioCatalog, existingId?: string): Album {
  const row = (input || {}) as Partial<Album>;
  const title = text(row.title, 140);
  if (!title) throw new Error("A picture page needs a title.");
  const images = cleanImages(row.images);
  if (!images.length) throw new Error("Add at least one picture.");
  const taken = new Set(catalog.albums.filter((item) => item.id !== existingId).map((item) => item.slug));
  const featured = images.some((image) => image.id === row.featuredImageId) ? row.featuredImageId : images[0]?.id;
  const previous = catalog.albums.find((item) => item.id === existingId);
  return {
    id: existingId || newId("album"),
    title,
    slug: uniqueSlug(text(row.slug, 80) || title, taken),
    caption: text(row.caption, 500),
    images,
    featuredImageId: featured,
    publishedAt: previous?.publishedAt || new Date().toISOString(),
    tags: cleanTags(row.tags),
  };
}
