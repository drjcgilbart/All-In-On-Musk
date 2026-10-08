import type { Metadata } from "next";
import { readCatalog } from "@/lib/studio/catalog";
import { coverOf, storyDate } from "@/components/story-body";
import "./journal.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal",
  description: "Stories, pictures, and videos added on the All In On Musk desk.",
  alternates: { canonical: "/journal" },
};

export default async function JournalPage() {
  const catalog = await readCatalog();
  const stories = [...catalog.stories].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return (
    <>
      <p className="kicker">Journal</p>
      <h1 className="page-title">Stories from this desk.</h1>
      <p className="lede">Writing added here stays on this site. Pictures and video have their own shelves.</p>
      <p className="piece-links">
        <a href="/pictures">Pictures</a>
        <a href="/watch">Videos</a>
      </p>
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
