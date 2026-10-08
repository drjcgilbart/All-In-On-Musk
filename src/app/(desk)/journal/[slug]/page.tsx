import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryBody, storyDate } from "@/components/story-body";
import { readCatalog } from "@/lib/studio/catalog";
import "../journal.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await readCatalog();
  const story = catalog.stories.find((item) => item.slug === slug);
  if (!story) return { title: "Journal" };
  return {
    title: story.title,
    description: story.excerpt || story.title,
    alternates: { canonical: `/journal/${story.slug}` },
  };
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const catalog = await readCatalog();
  const story = catalog.stories.find((item) => item.slug === slug);
  if (!story) notFound();
  return (
    <>
      <p className="kicker">
        <a href="/journal">Journal</a>
      </p>
      <h1 className="page-title">{story.title}</h1>
      <p className="note">{storyDate(story.publishedAt)}{story.tags.length ? ` · ${story.tags.join(" · ")}` : ""}</p>
      {story.excerpt ? <p className="lede">{story.excerpt}</p> : null}
      <StoryBody body={story.body} images={story.images} />
    </>
  );
}
