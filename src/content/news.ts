export type NewsItem = {
  id: string;
  title: string;
  source: string;
  href: string;
  time: string;
  iso: string;
  tags: string[];
  chip: "Confirmed" | "Reported" | "Rumor";
  summary: string;
};

/** Starter desk. Only items with a page we can point at. Not a live wire. */
export const news: NewsItem[] = [
  {
    id: "spcx-list",
    title: "SpaceX opened on Nasdaq as SPCX.",
    source: "NBC News",
    href: "https://www.nbcnews.com/business/markets/spacex-ipo-stock-price-rcna349760",
    time: "12 Jun 2026",
    iso: "2026-06-12T20:40:00Z",
    tags: ["SpaceX"],
    chip: "Confirmed",
    summary:
      "SpaceX began trading on Nasdaq under SPCX. NBC reported a first-day close of $160.95, up 19%. The live number on this desk is the chart, not that close.",
  },
  {
    id: "flight-14",
    title: "Starship Flight 14 reached orbit.",
    source: "SpaceX",
    href: "https://www.spacex.com/launches/starship-flight-14",
    time: "28 Sep 2026",
    iso: "2026-09-28T12:48:00Z",
    tags: ["SpaceX", "Starlink"],
    chip: "Confirmed",
    summary:
      "Ship 41 on Booster 21 lifted off from Starbase and was the first Starship stack to reach Earth orbit. SpaceX says it deployed Starlink satellites. The booster splashed in the Gulf. The ship came down in the Pacific.",
  },
  {
    id: "xai-spacex",
    title: "SpaceX and xAI combination reported.",
    source: "Reuters / Bloomberg",
    href: "https://cio.economictimes.indiatimes.com/news/corporate-news/spacex-merges-with-elon-musks-ai-startup-xai-to-alleviate-debt-woes/127925412",
    time: "3 Feb 2026",
    iso: "2026-02-03T12:00:00Z",
    tags: ["xAI", "SpaceX", "Merger", "X"],
    chip: "Reported",
    summary:
      "Reuters reported that SpaceX and xAI were combining, at a stated $1.25 trillion value for the enlarged company. Bloomberg's account, carried the same week, described it as Musk's announcement of a merger ahead of an expected IPO. This is not a Tesla deal.",
  },
  {
    id: "spacex-800",
    title: "Secondary sale talks at about $800 billion.",
    source: "Wall Street Journal",
    href: "https://www.wsj.com/business/spacex-in-talks-for-share-sale-that-would-boost-valuation-to-800-billion-b2852191",
    time: "5 Dec 2025",
    iso: "2025-12-05T12:00:00Z",
    tags: ["SpaceX"],
    chip: "Reported",
    summary:
      "The Journal reported SpaceX was in talks for a secondary share sale that would value the company around $800 billion. That was a private mark, before the Nasdaq listing.",
  },
  {
    id: "spacex-ipo-talk",
    title: "A 2026 listing was reported, not printed here.",
    source: "Reuters",
    href: "https://www.reuters.com/business/spacex-pursue-2026-ipo-raising-above-30-billion-bloomberg-news-reports-2025-12-09/",
    time: "9 Dec 2025",
    iso: "2025-12-09T12:00:00Z",
    tags: ["SpaceX", "Merger"],
    chip: "Rumor",
    summary:
      "Reuters, citing Bloomberg, reported SpaceX was looking at a 2026 IPO raising above $30 billion. The listing later printed on Nasdaq as SPCX. This item is the report, not the first trade.",
  },
];

export const newsFilters = [
  "Tesla",
  "Energy",
  "Semi",
  "Roadster",
  "Terafab",
  "Robotaxi",
  "SpaceX",
  "Starlink",
  "Neuralink",
  "Boring",
  "xAI",
  "X",
  "Merger",
  "Florida",
] as const;
