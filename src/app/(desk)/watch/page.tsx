import type { Metadata } from "next";
import { JournalVideos } from "@/components/journal-videos";
import { storyDate, youtubeThumb } from "@/components/story-body";
import { readCatalog } from "@/lib/studio/catalog";
import type { Clip } from "@/lib/studio/types";
import { fetchChannelVideos } from "@/lib/youtubeChannel";
import "../journal/journal.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Videos",
  description: "Journal videos from the All In On Musk channel, plus videos added on the desk.",
  alternates: { canonical: "/watch" },
};

/** Videos with their own coded page under /watch. Studio clips with the same slug or YouTube ID are skipped so nothing shows twice. */
const codedClips: Clip[] = [
  {
    id: "coded-grok-bot-best-model",
    title: "Grok Bot Will Use Claude: Musk's Best-Tool Bet Explained",
    slug: "grok-bot-best-model",
    description:
      "Musk says Grok Bot will use the best model for each task, including Claude Opus 5.5, Midjourney and Suno. SpaceX already sells compute to Anthropic, so it's both supplier and customer.",
    youtubeId: "evW52aF0x1I",
    publishedAt: "2026-10-08T12:00:00-04:00",
    tags: ["Grok Bot", "SpaceX", "SPCX"],
  },
];

export default async function WatchPage() {
  const [catalog, feed] = await Promise.all([readCatalog(), fetchChannelVideos()]);
  const studioClips = catalog.clips.filter(
    (clip) => !codedClips.some((coded) => coded.slug === clip.slug || (clip.youtubeId && coded.youtubeId === clip.youtubeId)),
  );
  const clips = [...codedClips, ...studioClips].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return (
    <>
      <p className="kicker">Videos</p>
      <h1 className="page-title">Video on the desk.</h1>
      <p className="piece-links">
        <a href="/journal">Journal</a>
        <a href="/pictures">Pictures</a>
      </p>
      <section className="section" id="journal-videos">
        <h2>Journal Videos</h2>
        <p className="note">Latest uploads from @allinonmusk.</p>
        <JournalVideos videos={feed.videos} stale={feed.stale} unavailable={feed.unavailable} />
      </section>
      <section className="section">
        <h2>Desk videos</h2>
        {clips.length === 0 ? (
          <p className="note">No videos yet.</p>
        ) : (
          <div className="card-grid">
            {clips.map((clip) => (
              <a className="plain-card span-6" href={`/watch/${clip.slug}`} key={clip.id}>
                <img src={clip.thumbnailUrl || youtubeThumb(clip.youtubeId)} alt="" />
                <p className="idx">{storyDate(clip.publishedAt)}</p>
                <h2>{clip.title}</h2>
                {clip.description ? <p>{clip.description}</p> : null}
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
