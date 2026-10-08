import type { Metadata } from "next";
import { NewsList } from "@/components/news-list";

export const metadata: Metadata = {
  title: "News",
  description: "Sourced notes on Tesla, SpaceX, Neuralink, The Boring Company, and xAI. Not a wire.",
  alternates: { canonical: "/news" },
};

export default function NewsPage() {
  return (
    <>
      <p className="kicker">News</p>
      <h1 className="page-title">The desk.</h1>
      <p className="lede">
        A starter pile of items we can point at. Official pages and primary reports first. A rumor is labeled a rumor. Empty filters mean the tag is not on this pile yet.
      </p>
      <NewsList />
    </>
  );
}
