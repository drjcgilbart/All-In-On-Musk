import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { storyDate } from "@/components/story-body";
import { readCatalog } from "@/lib/studio/catalog";
import "../../journal/journal.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await readCatalog();
  const clip = catalog.clips.find((item) => item.slug === slug);
  if (!clip) return { title: "Videos" };
  return {
    title: clip.title,
    description: clip.description || clip.title,
    alternates: { canonical: `/watch/${clip.slug}` },
  };
}

export default async function ClipPage({ params }: Props) {
  const { slug } = await params;
  const catalog = await readCatalog();
  const clip = catalog.clips.find((item) => item.slug === slug);
  if (!clip) notFound();
  return (
    <>
      <p className="kicker">
        <a href="/watch">Videos</a>
      </p>
      <h1 className="page-title">{clip.title}</h1>
      <p className="note">{storyDate(clip.publishedAt)}{clip.tags.length ? ` · ${clip.tags.join(" · ")}` : ""}</p>
      {clip.youtubeId ? (
        <div className="watch-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${clip.youtubeId}`}
            title={clip.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
      {clip.description ? <p className="lede">{clip.description}</p> : null}
    </>
  );
}
