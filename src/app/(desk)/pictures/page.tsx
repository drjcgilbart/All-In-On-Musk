import type { Metadata } from "next";
import { coverOf, storyDate } from "@/components/story-body";
import { readCatalog } from "@/lib/studio/catalog";
import "../journal/journal.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pictures",
  description: "Picture pages on the All In On Musk desk.",
  alternates: { canonical: "/pictures" },
};

export default async function PicturesPage() {
  const catalog = await readCatalog();
  const albums = [...catalog.albums].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return (
    <>
      <p className="kicker">Pictures</p>
      <h1 className="page-title">Pictures on the desk.</h1>
      <p className="piece-links">
        <a href="/journal">Journal</a>
        <a href="/watch">Videos</a>
      </p>
      <section className="section">
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
