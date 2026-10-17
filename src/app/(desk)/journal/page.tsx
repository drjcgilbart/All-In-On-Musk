import type { Metadata } from "next";
import { JournalVideos } from "@/components/journal-videos";
import { readCatalog } from "@/lib/studio/catalog";
import { coverOf, storyDate } from "@/components/story-body";
import { fetchChannelVideos } from "@/lib/youtubeChannel";
import "./journal.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal",
  description: "Videos, shorts, pictures, and stories added on the All In On Musk desk.",
  alternates: { canonical: "/journal" },
};

type View = "videos" | "pictures" | "stories";

function pickView(raw: string | string[] | undefined): View {
  const value = (Array.isArray(raw) ? raw[0] : raw || "").toLowerCase();
  if (value === "pictures" || value === "photos" || value === "images") return "pictures";
  if (value === "stories" || value === "writing") return "stories";
  return "videos";
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const view = pickView(params.view ?? params.tab);

  const toggle = (
    <nav className="filters journal-views" aria-label="Journal views">
      <a href="/journal" className={view === "videos" ? "on" : ""} aria-current={view === "videos" ? "page" : undefined}>
        Videos
      </a>
      <a href="/journal?view=pictures" className={view === "pictures" ? "on" : ""} aria-current={view === "pictures" ? "page" : undefined}>
        Pictures
      </a>
      <a href="/journal?view=stories" className={view === "stories" ? "on" : ""} aria-current={view === "stories" ? "page" : undefined}>
        Stories
      </a>
    </nav>
  );

  if (view === "videos") {
    const feed = await fetchChannelVideos();
    return (
      <>
        <p className="kicker">Journal</p>
        <h1 className="page-title">Video from this desk.</h1>
        <p className="lede">The newest uploads from @allinonmusk. Press a card and it plays here.</p>
        {toggle}
        <section className="section" id="journal-videos">
          <h2 className="sr">Videos and shorts</h2>
          <JournalVideos videos={feed.videos} stale={feed.stale} unavailable={feed.unavailable} />
        </section>
      </>
    );
  }

  const catalog = await readCatalog();

  if (view === "pictures") {
    const albums = [...catalog.albums].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return (
      <>
        <p className="kicker">Journal</p>
        <h1 className="page-title">Pictures from this desk.</h1>
        <p className="lede">Picture pages added here. Video is the default view of the Journal.</p>
        {toggle}
        <section className="section" aria-labelledby="pictures-title">
          <h2 id="pictures-title" className="sr">Pictures</h2>
          {albums.length === 0 ? (
            <p className="note">No picture pages yet.</p>
          ) : (
            <div className="card-grid">
              {albums.map((album) => {
                const cover = coverOf(album.images, album.featuredImageId);
                return (
                  <a className="plain-card span-6" href={`/pictures/${album.slug}`} key={album.id}>
                    {cover ? <img src={cover.url} alt="" /> : null}
                    <p className="idx">{storyDate(album.publishedAt)}</p>
                    <h2>{album.title}</h2>
                    {album.caption ? <p>{album.caption}</p> : null}
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </>
    );
  }

  const stories = [...catalog.stories].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return (
    <>
      <p className="kicker">Journal</p>
      <h1 className="page-title">Stories from this desk.</h1>
      <p className="lede">Writing added here stays on this site.</p>
      {toggle}
      <section className="section" aria-labelledby="stories-title">
        <h2 id="stories-title" className="sr">Stories</h2>
        {stories.length === 0 ? (
          <p className="note">No stories yet.</p>
        ) : (
          <div className="card-grid">
            {stories.map((story) => {
              const cover = coverOf(story.images, story.featuredImageId);
              return (
                <a className="plain-card span-6" href={`/journal/${story.slug}`} key={story.id}>
                  {cover ? <img src={cover.url} alt="" /> : null}
                  <p className="idx">{storyDate(story.publishedAt)}</p>
                  <h2>{story.title}</h2>
                  {story.excerpt ? <p>{story.excerpt}</p> : null}
                </a>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
