export const spacexMarks = [
  {
    date: "12 Jun 2026",
    label: "Nasdaq open",
    value: "SPCX · close $160.95",
    source: "NBC News",
    href: "https://www.nbcnews.com/business/markets/spacex-ipo-stock-price-rcna349760",
    note: "First day on Nasdaq, ticker SPCX. NBC reported a 19% gain to a $160.95 close. That is the first session, not the live print on this desk.",
  },
  {
    date: "5 Dec 2025",
    label: "Secondary talks",
    value: "~$800 billion",
    source: "Wall Street Journal",
    href: "https://www.wsj.com/business/spacex-in-talks-for-share-sale-that-would-boost-valuation-to-800-billion-b2852191",
    note: "Reported talks for a private share sale. Not a closing price.",
  },
  {
    date: "9 Dec 2025",
    label: "IPO report",
    value: "Raise above $30 billion",
    source: "Reuters, citing Bloomberg",
    href: "https://www.reuters.com/business/spacex-pursue-2026-ipo-raising-above-30-billion-bloomberg-news-reports-2025-12-09/",
    note: "A reported plan for a 2026 listing. The shares later opened on Nasdaq as SPCX.",
  },
  {
    date: "Feb 2026",
    label: "xAI combination",
    value: "$1.25 trillion reported",
    source: "Reuters / Bloomberg",
    href: "https://cio.economictimes.indiatimes.com/news/corporate-news/spacex-merges-with-elon-musks-ai-startup-xai-to-alleviate-debt-woes/127925412",
    note: "Reported value of an enlarged SpaceX plus xAI. A deal figure, not a share price.",
  },
] as const;

export type MergerChip = "Confirmed" | "Reported" | "Rumor" | "Speculation" | "Headline";

export type MergerEntry = {
  /** ISO date (Eastern) used for sorting. */
  iso: string;
  /** Display date. */
  date: string;
  who: string;
  chip: MergerChip;
  text: string;
  href: string;
};

/** Hand-curated. Order here does not matter; the page sorts newest first. */
export const mergerTimeline: MergerEntry[] = [
  {
    iso: "2025-12-05",
    date: "5 Dec 2025",
    who: "Wall Street Journal",
    chip: "Reported",
    text: "Reported secondary-sale talks that would mark SpaceX near $800 billion. A valuation story, not a Tesla combination.",
    href: "https://www.wsj.com/business/spacex-in-talks-for-share-sale-that-would-boost-valuation-to-800-billion-b2852191",
  },
  {
    iso: "2025-12-09",
    date: "9 Dec 2025",
    who: "Reuters, citing Bloomberg",
    chip: "Rumor",
    text: "Reported that SpaceX was pursuing a 2026 public listing raising above $30 billion. A listing is not a merger with Tesla.",
    href: "https://www.reuters.com/business/spacex-pursue-2026-ipo-raising-above-30-billion-bloomberg-news-reports-2025-12-09/",
  },
  {
    iso: "2026-01-29",
    date: "29 Jan 2026",
    who: "Bloomberg",
    chip: "Reported",
    text: "Reported that SpaceX had discussed the feasibility of a tie-up with Tesla, and separately a combination with xAI, citing people familiar with the matter.",
    href: "https://www.bloomberg.com/news/articles/2026-01-29/elon-musk-s-spacex-is-said-to-consider-merger-with-tesla-or-xai",
  },
  {
    iso: "2026-02-03",
    date: "3 Feb 2026",
    who: "Reuters, and Bloomberg the same week",
    chip: "Reported",
    text: "Reported a SpaceX combination with xAI at a stated $1.25 trillion value. SpaceX's later IPO filing lists the xAI merger as effective February 2. It joined the rocket company and the model company, not Tesla.",
    href: "https://cio.economictimes.indiatimes.com/news/corporate-news/spacex-merges-with-elon-musks-ai-startup-xai-to-alleviate-debt-woes/127925412",
  },
  {
    iso: "2026-03-15",
    date: "Mar 2026",
    who: "Tesla 10-Q (SEC)",
    chip: "Confirmed",
    text: "Tesla says its $2 billion investment, first agreed as xAI preferred stock, became SpaceX common stock in March 2026: under 1% ownership, booked under the equity method. A stake, not a merger.",
    href: "https://www.sec.gov/Archives/edgar/data/1318605/000162828026026673/R20.htm",
  },
  {
    iso: "2026-03-21",
    date: "21 Mar 2026",
    who: "Elon Musk, via Reuters",
    chip: "Confirmed",
    text: "Musk announced Terafab, an AI chip complex in Austin built by SpaceX and Tesla together: two fabs, one for cars and robots, one for data centers. The biggest shared project between the two.",
    href: "https://www.reuters.com/business/autos-transportation/musk-says-spacex-tesla-build-advanced-chip-factories-austin-2026-03-22/",
  },
  {
    iso: "2026-04-07",
    date: "7 Apr 2026",
    who: "Intel, via Reuters",
    chip: "Confirmed",
    text: "Intel said it will join the Terafab chip project with SpaceX and Tesla.",
    href: "https://www.reuters.com/business/autos-transportation/intel-join-musks-terafab-mega-ai-chip-project-2026-04-07/",
  },
  {
    iso: "2026-04-07",
    date: "7 Apr 2026",
    who: "Wall Street Journal",
    chip: "Speculation",
    text: "Reported that investors and analysts were already debating a SpaceX and Tesla combination ahead of the IPO. Musk had said his companies are converging, but had not commented on a merger.",
    href: "https://www.wsj.com/business/spacex-isnt-even-public-yet-and-investors-are-already-abuzz-about-a-tesla-merger-592b64f6",
  },
  {
    iso: "2026-05-26",
    date: "26 May 2026",
    who: "CNBC",
    chip: "Reported",
    text: "Reported, citing people familiar with the talks, that Musk had discussed folding the two companies together with colleagues. Neither company confirmed it.",
    href: "https://www.cnbc.com/2026/05/26/spacex-tesla-merger-chatter-reignites-as-musk-rocket-company-nears-ipo.html",
  },
  {
    iso: "2026-06-12",
    date: "12 Jun 2026",
    who: "NBC News",
    chip: "Confirmed",
    text: "SpaceX began trading on Nasdaq as SPCX at $135 a share. Both companies are now listed, so any combination needs two shareholder votes.",
    href: "https://www.nbcnews.com/business/markets/spacex-ipo-stock-price-rcna349760",
  },
  {
    iso: "2026-07-22",
    date: "22 Jul 2026",
    who: "Elon Musk, Tesla earnings call, via Reuters",
    chip: "Confirmed",
    text: "Musk did not rule a merger out: \u201cthere's more and more overlap,\u201d especially Terafab. He added that combining companies is not for an earnings call and would need the appropriate process.",
    href: "https://www.reuters.com/legal/legalindustry/musk-keeps-tesla-spacex-merger-speculation-alive-cites-growing-overlap-2026-07-23/",
  },
  {
    iso: "2026-09-14",
    date: "14 Sep 2026",
    who: "Elon Musk, All-In Summit, via Yahoo Finance",
    chip: "Confirmed",
    text: "Asked whether the companies stay separate, Musk said: \u201cwho can imagine what action one might take when there's so much close collaboration in so many areas.\u201d A hint, not an announcement.",
    href: "https://finance.yahoo.com/markets/stocks/article/musk-hints-again-at-possible-spacex-tesla-merger-135029754.html",
  },
  {
    iso: "2026-10-14",
    date: "14 Oct 2026",
    who: "Barclays note, via Yahoo Finance",
    chip: "Speculation",
    text: "Barclays said an announcement could come before Tesla's annual meeting (due by Dec 6), most likely SpaceX buying Tesla in stock at about 0.7 SpaceX shares per Tesla share. An analyst view, not a proposal.",
    href: "https://finance.yahoo.com/markets/stocks/articles/tesla-spacex-merger-could-announced-234757020.html",
  },
  {
    iso: "2026-10-15",
    date: "15 Oct 2026",
    who: "Elon Musk on X",
    chip: "Confirmed",
    text: "Musk posted \u201cTesla x SpaceX\u201d with the Roadster event livestream. The Roadster demo, filmed at a SpaceX test site, used SpaceX thruster technology to hover.",
    href: "https://x.com/elonmusk/status/2110894635904110632",
  },
  {
    iso: "2026-10-16",
    date: "16 Oct 2026",
    who: "CNBC",
    chip: "Speculation",
    text: "Kalshi traders lifted the odds of a merger before March 2027 to 56% from 29% after the Barclays note and the Roadster demo. Prediction-market odds, not a filing.",
    href: "https://www.cnbc.com/2026/10/16/tesla-spacex-merger-odds-rise-on-kalshi.html",
  },
];

/** Newest first, always. */
export function sortMerger<T extends { iso: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => b.iso.localeCompare(a.iso));
}

export const mergerQuestions = [
  "Who would own the combined equity, and whose vote actually moves?",
  "What does a regulator say about a car company holding a launch license, or the reverse?",
  "Starlink sells connectivity. Auto sells a vehicle. Which P&L is the parent?",
  "Tesla already buys and invests across the group. Does a merger change the product, or only the cap table?",
];

export const mergerCounter = [
  "SpaceX has launch licenses, export rules, and government customers that a car company does not.",
  "Tesla and SpaceX are both listed. Putting them together is a vote of two shareholder bases, plus the launch license and the export rules.",
  "The February 2026 deal joined xAI to SpaceX, not Tesla to SpaceX. The firms can share a founder and stay separate.",
  "A commentator's chain — one company rescues the next — is an opinion. It is not a term sheet.",
];

export const glossary = [
  { term: "FSD", text: "Full Self-Driving. Tesla's driver-assistance software. Supervised means a person is still responsible." },
  { term: "Unsupervised", text: "The car operates with no person accountable in the seat. A geofence and a regulator decide where that sentence is true." },
  { term: "Megapack", text: "Tesla's utility-scale battery. A grid product, not a car option." },
  { term: "DTC", text: "Direct to cell. Starlink radios talking to a normal phone, without a dish on the roof." },
  { term: "Colossus", text: "Public name for xAI's large training cluster. Counts in posts go stale fast." },
  { term: "Terafab", text: "A discussed wafer fab large enough to feed the chip habit. Not a plant address on this desk." },
  { term: "Cybercab", text: "Tesla's purpose-built robotaxi concept. The workbook price is a placeholder, not a sticker." },
  { term: "Deadhead", text: "Miles with no paying rider. The empty trip to the pickup, and the trip home to the depot." },
  { term: "Geofence", text: "The polygon where a service is allowed to drive. Outside it, the car is a car." },
  { term: "EBITDA", text: "Profit before interest, tax, and depreciation. A workbook line. Not cash in the account." },
];

export const bench = [
  { name: "Roadster", chip: "Announced" as const, href: "/machines/tesla" },
  { name: "Semi", chip: "Limited" as const, href: "/machines/tesla" },
  { name: "Terafab", chip: "Discussed" as const, href: "/machines/terafab" },
  { name: "Robotaxi Florida", chip: "Reported" as const, href: "/projects/robotaxi" },
];

export const watchlist = [
  { name: "Terafab", chip: "Discussed" as const, note: "A sentence, not a site." },
  { name: "Roadster", chip: "Announced" as const, note: "No production car." },
  { name: "Semi volume", chip: "Limited" as const, note: "Pilots are not a run rate." },
  { name: "Unsupervised geofence", chip: "Reported" as const, note: "Narrow, and contested." },
  { name: "Starship", chip: "Confirmed" as const, note: "Flight 14 made orbit 28 Sep 2026." },
  { name: "Tesla–SpaceX merger", chip: "Rumor" as const, note: "Asked about. Not a term sheet." },
];

export const milestones = [
  {
    date: "28 Sep 2026",
    chip: "Confirmed" as const,
    text: "Starship Flight 14, Ship 41 on Booster 21, reached Earth orbit from Starbase. SpaceX’s launch page is the source.",
    href: "https://www.spacex.com/launches/starship-flight-14",
  },
  {
    date: "12 Jun 2026",
    chip: "Confirmed" as const,
    text: "SpaceX listed on Nasdaq as SPCX. NBC reported a first-day close of $160.95.",
    href: "https://www.nbcnews.com/business/markets/spacex-ipo-stock-price-rcna349760",
  },
  {
    date: "Feb 2026",
    chip: "Reported" as const,
    text: "SpaceX and xAI were reported as combining, at a stated $1.25 trillion value. That is not a Tesla combination.",
    href: "https://cio.economictimes.indiatimes.com/news/corporate-news/spacex-merges-with-elon-musks-ai-startup-xai-to-alleviate-debt-woes/127925412",
  },
  {
    date: "9 Dec 2025",
    chip: "Rumor" as const,
    text: "Reuters, citing Bloomberg, reported a 2026 SpaceX IPO raising above $30 billion. A report is not a listing.",
    href: "https://www.reuters.com/business/spacex-pursue-2026-ipo-raising-above-30-billion-bloomberg-news-reports-2025-12-09/",
  },
  {
    date: "5 Dec 2025",
    chip: "Reported" as const,
    text: "The Wall Street Journal reported secondary-sale talks that would mark SpaceX near $800 billion. That was a private mark, months before the Nasdaq listing.",
    href: "https://www.wsj.com/business/spacex-in-talks-for-share-sale-that-would-boost-valuation-to-800-billion-b2852191",
  },
];

export const accounts = [
  { name: "Elon Musk", href: "https://x.com/elonmusk" },
  { name: "Tesla", href: "https://x.com/tesla" },
  { name: "SpaceX", href: "https://x.com/spacex" },
  { name: "Neuralink", href: "https://x.com/neuralink" },
  { name: "The Boring Company", href: "https://x.com/boringcompany" },
  { name: "xAI", href: "https://x.com/xai" },
];
