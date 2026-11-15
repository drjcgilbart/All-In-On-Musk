import type { Metadata } from "next";
import { podcastEmbedUrl, podcastUrl, site } from "@/content/site";

const pageTitle = "Podcast";
const pageDescription =
  "All In On Musk is an unofficial fan podcast on Tesla, SpaceX, Starship, xAI, Neuralink, The Boring Company, and X. Host Jon Vale breaks down the biggest stories and pushes back on the hype and the hit pieces.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/podcast" },
  openGraph: {
    title: `${pageTitle} — ${site.name}`,
    description: pageDescription,
    url: "/podcast",
    siteName: site.name,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: site.name,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} — ${site.name}`,
    description: pageDescription,
    images: ["/opengraph-image"],
  },
};

export default function PodcastPage() {
  return (
    <>
      <p className="kicker">Podcast</p>
      <h1 className="page-title">Hear it.</h1>
      <p className="lede">{pageDescription}</p>
      <div style={{ margin: "1.2rem 0", maxWidth: "100%" }}>
        <iframe
          src={podcastEmbedUrl}
          width="100%"
          height="352"
          style={{ border: 0, borderRadius: 12, display: "block", width: "100%", maxWidth: "100%" }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="All In On Musk podcast on Spotify"
        />
      </div>
      <p className="home-shop-cta">
        <a className="letter-cta" href={podcastUrl} target="_blank" rel="noopener noreferrer">
          Follow on Spotify
        </a>
      </p>
      <p className="note">
        <a className="letter-quiet" href="/watch">
          Video versions
        </a>
      </p>
    </>
  );
}
