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
  const album = catalog.albums.find((item) => item.slug === slug);
  if (!album) return { title: "Pictures" };
  return {
    title: album.title,
    description: album.caption || album.title,
    alternates: { canonical: `/pictures/${album.slug}` },
  };
}

export default async function AlbumPage({ params }: Props) {
  const { slug } = await params;
  const catalog = await readCatalog();
  const album = catalog.albums.find((item) => item.slug === slug);
  if (!album) notFound();
  return (
    <>
      <p className="kicker">
        <a href="/pictures">Pictures</a>
      </p>
      <h1 className="page-title">{album.title}</h1>
      {album.caption ? <p className="lede">{album.caption}</p> : null}
      <p className="note">{storyDate(album.publishedAt)}{album.tags.length ? ` · ${album.tags.join(" · ")}` : ""}</p>
      <div className="story">
        {album.images.map((image) => (
          <figure key={image.id}>
            <img src={image.url} alt={image.caption || album.title} />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
    </>
  );
}
