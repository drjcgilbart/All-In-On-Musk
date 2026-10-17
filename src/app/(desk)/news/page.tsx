import type { Metadata } from "next";
import { NewsList } from "@/components/news-list";
import { getLiveNews } from "@/lib/liveNews";
import { NewsVideos } from "@/components/news-videos";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "News",
  description: "Sourced notes on Tesla, SpaceX, Neuralink, The Boring Company, and xAI. Not a wire.",
  alternates: { canonical: "/news" },
};

export default async function NewsPage() {
  const items = await getLiveNews(30);
  return (
    <>
      <p className="kicker">News</p>
      <h1 className="page-title">The desk.</h1>
      <p className="lede">
        Pulled from the news wires every morning, newest first. Headlines are ours, the story is at the link. Empty filters mean nothing on that tag this week.
      </p>
      <NewsVideos limit={30} layout="player" />
      <NewsList items={items} />
    </>
  );
}
