import { readCatalog } from "@/lib/studio/catalog";
import { coverOf, storyDate, youtubeThumb } from "./story-body";

export async function JournalStrip() {
  let catalog;
  try {
    catalog = await readCatalog();
  } catch {
    return null;
  }
  const stories = [...catalog.stories].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 2);
  const albums = [...catalog.albums].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 1);
  const clips = [...catalog.clips].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 1);
  if (!stories.length && !albums.length && !clips.length) return null;
  return (
    <section className="section" aria-labelledby="journal-title">
      <h2 id="journal-title">Journal</h2>
      <p className="note">Stories, pictures, and video added on this desk.</p>
      <div className="card-grid">
        {stories.map((story) => {
          const cover = coverOf(story.images, story.featuredImageId);
          return (
            <a className="plain-card span-6" href={`/journal/${story.slug}`} key={story.id}>
              {cover ? <img src={cover.url} alt="" /> : null}
              <p className="idx">{storyDate(story.publishedAt)}</p>
              <h3>{story.title}</h3>
              {story.excerpt ? <p>{story.excerpt}</p> : null}
            </a>
          );
        })}
        {albums.map((album) => {
          const cover = coverOf(album.images, album.featuredImageId);
          return (
            <a className="plain-card span-6" href={`/pictures/${album.slug}`} key={album.id}>
              {cover ? <img src={cover.url} alt="" /> : null}
              <p className="idx">Pictures · {storyDate(album.publishedAt)}</p>
              <h3>{album.title}</h3>
            </a>
          );
        })}
        {clips.map((clip) => (
          <a className="plain-card span-6" href={`/watch/${clip.slug}`} key={clip.id}>
            <img src={clip.thumbnailUrl || youtubeThumb(clip.youtubeId)} alt="" />
            <p className="idx">Video · {storyDate(clip.publishedAt)}</p>
            <h3>{clip.title}</h3>
          </a>
        ))}
      </div>
    </section>
  );
}
