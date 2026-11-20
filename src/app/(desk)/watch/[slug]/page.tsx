import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LetterVideo } from "@/components/letter-video";
import { storyDate } from "@/components/story-body";
import { podcastUrl } from "@/content/site";
import { getChannelRss, watchPathForVideo } from "@/lib/channelRss";
import { readCatalog } from "@/lib/studio/catalog";
import "../../journal/journal.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const YOUTUBE_ID = /^[\w-]{11}$/;

function dedicatedWatchPath(slug: string) {
  if (!YOUTUBE_ID.test(slug)) return null;
  const path = watchPathForVideo(slug);
  return path === `/watch/${slug}` ? null : path;
}

async function findClip(slug: string) {
  const catalog = await readCatalog();
  return catalog.clips.find((item) => item.slug === slug) ?? null;
}

async function channelVideo(slug: string) {
  if (!YOUTUBE_ID.test(slug)) return null;
  const videos = await getChannelRss(15);
  return videos.find((video) => video.id === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dedicated = dedicatedWatchPath(slug);
  if (dedicated) return { title: "Videos" };
  const clip = await findClip(slug);
  if (clip) {
    return {
      title: clip.title,
      description: clip.description || clip.title,
      alternates: { canonical: `/watch/${clip.slug}` },
    };
  }
  if (!YOUTUBE_ID.test(slug)) return { title: "Videos" };
  const video = await channelVideo(slug);
  const title = video?.title || "Video";
  return {
    title,
    description: video?.summary || title,
    alternates: { canonical: `/watch/${slug}` },
  };
}

export default async function ClipPage({ params }: Props) {
  const { slug } = await params;
  const dedicated = dedicatedWatchPath(slug);
  if (dedicated) redirect(dedicated);
  const clip = await findClip(slug);
  if (!clip && YOUTUBE_ID.test(slug)) {
    const video = await channelVideo(slug);
    const title = video?.title || "Video";
    return (
      <>
        <p className="kicker">
          <a href="/watch">Videos</a>
        </p>
        <h1 className="page-title">{title}</h1>
        {video?.dateLabel ? <p className="note">{video.dateLabel}</p> : null}
        <LetterVideo id={slug} title={title} />
        {video?.summary ? <p className="lede">{video.summary}</p> : null}
      </>
    );
  }
  if (!clip) notFound();
  return (
    <>
      <p className="kicker">
        <a href="/watch">Videos</a>
      </p>
      <h1 className="page-title">{clip.title}</h1>
      <p className="note">{storyDate(clip.publishedAt)}{clip.tags.length ? ` · ${clip.tags.join(" · ")}` : ""}</p>
      {clip.youtubeId ? (
        <>
          <div className="watch-frame">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${clip.youtubeId}`}
              title={clip.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="piece-links">
            <a href={podcastUrl} target="_blank" rel="noopener noreferrer">
              Listen on Spotify
            </a>
          </p>
        </>
      ) : null}
      {clip.description ? <p className="lede">{clip.description}</p> : null}
    </>
  );
}
