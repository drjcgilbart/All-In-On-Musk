import type { Metadata } from "next";
import Link from "next/link";
import { WatchPlayer } from "./watch-player";
import "../../journal/journal.css";

const videoId = "evW52aF0x1I";
const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
const channelUrl = "https://www.youtube.com/@AllInOnMusk";
const pageTitle = "Grok Bot Will Use Claude: Musk's Best-Tool Bet Explained";
const pageDescription =
  "Musk says Grok Bot will use the best model for each task, including Claude Opus 5.5, Midjourney and Suno. SpaceX already sells compute to Anthropic, so it is both supplier and customer. Opinion, not financial advice.";
const thumb = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/watch/grok-bot-best-model" },
  openGraph: {
    title: `${pageTitle} — All In On Musk`,
    description: pageDescription,
    url: "/watch/grok-bot-best-model",
    siteName: "All In On Musk",
    type: "website",
    images: [{ url: thumb, width: 1280, height: 720, alt: "Data-center server racks with the video title" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} — All In On Musk`,
    description: pageDescription,
    images: [thumb],
  },
};

const chapters = [
  { t: 0, label: "0:00", title: "Cold open: Grok Bot goes multi-model" },
  { t: 53, label: "0:53", title: "What Musk actually said" },
  { t: 100, label: "1:40", title: "Grok Bot & Claude as the brain" },
  { t: 157, label: "2:37", title: "SpaceX: supplier and customer" },
  { t: 205, label: "3:25", title: "Why “best tool wins” matters" },
  { t: 268, label: "4:28", title: "What it says about Grok" },
  { t: 318, label: "5:18", title: "Risks & open questions" },
  { t: 374, label: "6:14", title: "What to watch & bottom line" },
];

const chapterEnds = [...chapters.slice(1).map((item) => item.t), 453];

const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: pageTitle,
  description: pageDescription,
  thumbnailUrl: [thumb, `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`],
  uploadDate: "2026-10-08",
  duration: "PT7M33S",
  embedUrl: `https://www.youtube.com/embed/${videoId}`,
  url: "https://allinonmusk.com/watch/grok-bot-best-model",
  inLanguage: "en",
  publisher: { "@type": "Organization", name: "All In On Musk", url: "https://allinonmusk.com" },
  hasPart: chapters.map((item, index) => ({
    "@type": "Clip",
    name: item.title,
    startOffset: item.t,
    endOffset: chapterEnds[index],
    url: `${videoUrl}&t=${item.t}s`,
  })),
};

const sources = [
  {
    meta: "Primary · Elon Musk on X · Oct. 7, 2026, 2:46 AM ET",
    title: "“Important note regarding Grok @Bot: Going forward, @SpaceX will use the best back end model for any given task…”",
    href: "https://x.com/elonmusk/status/2107724314451878104",
  },
  {
    meta: "Primary · Anthropic · Sept. 22, 2026",
    title: "Introducing Claude Opus 5.5",
    href: "https://www.anthropic.com/claude-opus-5-5",
  },
  {
    meta: "Primary · Anthropic docs",
    title: "Claude Opus 5.5 model overview",
    href: "https://platform.claude.com/docs/en/models/opus-5-5/overview",
  },
  {
    meta: "Reporting · The Next Web · Oct. 7, 2026",
    title: "Musk’s Grok Bot will use Anthropic’s Claude, Midjourney and Suno models",
    href: "https://thenextweb.com/news/grok-bot-claude-opus-midjourney-suno-musk",
  },
  {
    meta: "Reporting · Tbreak · Oct. 7, 2026",
    title: "Grok Bot now runs on Anthropic’s Claude, with Midjourney and Suno next",
    href: "https://tbreak.com/grok-bot-claude-opus-midjourney-suno/",
  },
  {
    meta: "Reporting · Tech City Authority · Oct. 7, 2026",
    title: "Grok Bot will run on Claude Opus 5.5 and tap Midjourney and Suno",
    href: "https://www.techcityauthority.com/2026/10/grok-bot-best-model-claude-midjourney-suno.html",
  },
  {
    meta: "Reporting · CNBC · Oct. 7, 2026, 12:32 PM ET",
    title: "Apollo, banks in talks to finance SpaceX’s $40 billion Nvidia GPU purchase",
    href: "https://www.cnbc.com/2026/10/07/spacex-nvidia-chips-apollo-financing.html",
  },
];

const licenses = {
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0",
  "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0",
} as Record<string, string>;

const commons = "https://commons.wikimedia.org/wiki/File:";
const nasa = "https://images.nasa.gov/details/";
const nasaPd = "Public domain (NASA media; U.S. Government work)";

const photos = [
  { title: "Datacenter Server Racks (22370909788).jpg", by: "Carl Lender from Sunrise, USA", license: "CC BY 2.0", where: "Wikimedia Commons", href: `${commons}Datacenter_Server_Racks_(22370909788).jpg` },
  { title: "Macro laptop coding (Unsplash).jpg", by: "Marc Mueller seven11nash", license: "CC0", where: "Wikimedia Commons", href: `${commons}Macro_laptop_coding_(Unsplash).jpg` },
  { title: "Starbase.jpg", by: "Jenny Hautmann", license: "CC BY-SA 4.0", where: "Wikimedia Commons", href: `${commons}Starbase.jpg` },
  { title: "Starship & Moonset.jpg", by: "Hotel Pika", license: "CC BY-SA 2.0", where: "Wikimedia Commons", href: `${commons}Starship_%26_Moonset.jpg` },
  { title: "Space X booster Full Stack.jpg", by: "Jenny Hautmann", license: "CC BY-SA 4.0", where: "Wikimedia Commons", href: `${commons}Space_X_booster_Full_Stack.jpg` },
  { title: "Lines of code (Unsplash).jpg", by: "Artem Sapegin sapegin", license: "CC0", where: "Wikimedia Commons", href: `${commons}Lines_of_code_(Unsplash).jpg` },
  { title: "Technician with laptop working on server rack at NERSC.jpg", by: "Derrick Coetzee from Berkeley, CA, USA", license: "CC0", where: "Wikimedia Commons", href: `${commons}Technician_with_laptop_working_on_server_rack_at_NERSC.jpg` },
  { title: "A blue-green airglow blankets the bright city lights of the eastern United States", by: "JSC", license: nasaPd, where: "NASA Image and Video Library", href: `${nasa}iss073e0982450` },
  { title: "USA - Texas - Boca Chica - Starbase (51285307187).jpg", by: "Alexander Hatley from Spring, Texas, USA", license: "CC BY 2.0", where: "Wikimedia Commons", href: `${commons}USA_-_Texas_-_Boca_Chica_-_Starbase_(51285307187).jpg` },
  { title: "Aurora Borealis and city lights on the horizon taken by the Expedition 29 crew", by: "Mike Fossum", license: nasaPd, where: "NASA Image and Video Library", href: `${nasa}iss029e012564` },
  { title: "USA - Texas - Boca Chica - Starbase (51287483991).jpg", by: "Alexander Hatley from Spring, Texas, USA", license: "CC BY 2.0", where: "Wikimedia Commons", href: `${commons}USA_-_Texas_-_Boca_Chica_-_Starbase_(51287483991).jpg` },
  { title: "Liftoff of SpaceX IFT-5 (54064037095).jpg", by: "Steve Jurvetson from Los Altos, USA", license: "CC BY 2.0", where: "Wikimedia Commons", href: `${commons}Liftoff_of_SpaceX_IFT-5_(54064037095).jpg` },
  { title: "SpaceX Starship hot staging IFT-5.jpg", by: "Steve Jurvetson", license: "CC BY 2.0", where: "Wikimedia Commons", href: `${commons}SpaceX_Starship_hot_staging_IFT-5.jpg` },
  { title: "Tower + Booster.jpg", by: "Jenny Hautmann", license: "CC BY-SA 4.0", where: "Wikimedia Commons", href: `${commons}Tower_%2B_Booster.jpg` },
  { title: "The launch of the SpaceX Starship 6 rocket seen from the space station", by: "NASA/Don Pettit", license: nasaPd, where: "NASA Image and Video Library", href: `${nasa}iss072e220043` },
  { title: "Starbase Keeps on Growing (54070651112).jpg", by: "Steve Jurvetson from Los Altos, USA", license: "CC BY 2.0", where: "Wikimedia Commons", href: `${commons}Starbase_Keeps_on_Growing_(54070651112).jpg` },
  { title: "Starlink Mission (47926144123).jpg", by: "Official SpaceX Photos", license: "CC0", where: "Wikimedia Commons", href: `${commons}Starlink_Mission_(47926144123).jpg` },
  { title: "Starship-IFT2-ascent.jpg", by: "Osunpokeh", license: "CC BY-SA 4.0", where: "Wikimedia Commons", href: `${commons}Starship-IFT2-ascent.jpg` },
  { title: "SpaceX CLPS IM-2 Liftoff", by: "NASA/Kenneth W. Culberson", license: nasaPd, where: "NASA Image and Video Library", href: `${nasa}KSC-20250226-PH-KWC01_0001` },
  { title: "Starship SN9 Night.jpg", by: "Jared Krahn", license: "CC BY-SA 4.0", where: "Wikimedia Commons", href: `${commons}Starship_SN9_Night.jpg` },
  { title: "Launch of Falcon 9 carrying DSCOVR (16673053086).jpg", by: "SpaceX", license: "CC0", where: "Wikimedia Commons", href: `${commons}Launch_of_Falcon_9_carrying_DSCOVR_(16673053086).jpg` },
];

const otherCredits = [
  "Title cards, quote cards, stat and diagram cards, lower third, end card and thumbnail: original graphics made for All In on Musk. The quote card reproduces the text of a public X post with no profile photo. Model and company names appear as plain text only, with no logos.",
  "Channel intro and end screen: the channel’s own assets.",
  "Music: an original ambient pad synthesized in code for this video (no samples or third-party material). Royalty-free.",
  "Narration: the channel host’s own voice.",
  "Fonts: Barlow Condensed, Inter, Geist Mono, Oswald (SIL Open Font License).",
];

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

export default function GrokBotBestModelPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd).replace(/</g, "\\u003c") }}
      />
      <p className="kicker">
        <Link href="/watch">Videos</Link>
      </p>
      <h1 className="page-title">{pageTitle}</h1>
      <p className="note">October 8, 2026 · 7:33 · Grok Bot · SpaceX · SPCX</p>
      <p className="lede">
        Musk says Grok Bot will use the best model for each task, including Claude Opus 5.5, Midjourney and Suno.
        <br />
        SpaceX already sells compute to Anthropic, so it’s both supplier and customer. Opinion and commentary only, not financial advice.
      </p>

      <WatchPlayer videoId={videoId} title={pageTitle} />

      <p className="piece-links">
        <a href={videoUrl} {...ext}>
          Watch on YouTube
        </a>
        <a href={`${channelUrl}?sub_confirmation=1`} {...ext}>
          Subscribe
        </a>
        <Link href="/">Home</Link>
      </p>

      <section className="section">
        <h2>Chapters</h2>
        <ol className="mark-list">
          {chapters.map((item) => (
            <li key={item.t}>
              <a href={`${videoUrl}&t=${item.t}s`} {...ext}>
                <span className="idx">{item.label}</span> {item.title}
              </a>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <h2>Sources</h2>
        <p className="note">Facts checked on Oct. 8, 2026. All times ET.</p>
        <ol className="mark-list">
          {sources.map((item) => (
            <li key={item.href}>
              <p className="mono note">{item.meta}</p>
              <a href={item.href} {...ext}>
                {item.title}
              </a>
            </li>
          ))}
          <li>
            <p className="mono note">Also seen, not quoted</p>
            <p>explainx.ai and AICoder coverage of the same post, plus X News summaries (Oct. 7–8, 2026).</p>
          </li>
        </ol>
      </section>

      <section className="section">
        <h2>Credits</h2>
        <p className="note">
          Every visual is public domain, CC0 or Creative Commons. No company logos. No identifiable faces.
        </p>
        <ul className="question-list">
          {photos.map((item) => (
            <li key={item.href}>
              <a href={item.href} {...ext}>
                {item.title}
              </a>
              <p className="note">
                {item.by} ·{" "}
                {licenses[item.license] ? (
                  <a href={licenses[item.license]} {...ext}>
                    {item.license}
                  </a>
                ) : (
                  item.license
                )}{" "}
                · {item.where}
              </p>
            </li>
          ))}
          {otherCredits.map((item) => (
            <li key={item}>
              <p className="note">{item}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <p className="note">
          Opinion and commentary only, not financial advice. Not affiliated with SpaceX, Tesla, Anthropic, Midjourney or Suno.
        </p>
        <p className="piece-links">
          <a href={videoUrl} {...ext}>
            Watch on YouTube
          </a>
          <a href={`${channelUrl}?sub_confirmation=1`} {...ext}>
            Subscribe
          </a>
          <Link href="/watch">Videos</Link>
          <Link href="/">Home</Link>
        </p>
      </section>
    </>
  );
}
