import type { Metadata } from "next";
import { Chip } from "@/components/chip";
import { mergerCounter, mergerQuestions, mergerTimeline, sortMerger, type MergerEntry } from "@/content/records";
import { getLiveMerger } from "@/lib/liveNews";

/** Rebuilt at most every 6h, and forced by the 6 AM ET news refresh. */
export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Merger",
  description: "Public comments and reports about a Tesla and SpaceX combination. Questions, not a prediction.",
  alternates: { canonical: "/merger" },
};

type Row = MergerEntry & { live?: boolean };

const etDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "America/New_York" });
const etIso = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

async function rows(): Promise<Row[]> {
  const live = await getLiveMerger(4).catch(() => []);
  const curatedHrefs = new Set(mergerTimeline.map((m) => norm(m.href)));
  const extra: Row[] = live
    .filter((n) => !curatedHrefs.has(norm(n.href)))
    .map((n) => ({
      iso: `${etIso(n.iso)}T${n.iso.slice(11, 19)}`,
      date: etDate(n.iso),
      who: n.source,
      chip: "Headline" as const,
      text: `${n.title.replace(/\s+/g, " ").trim()} (Headline from the morning news pull. Full story at the link.)`,
      href: n.href,
      live: true,
    }));
  return sortMerger<Row>([...mergerTimeline, ...extra]);
}

export default async function MergerPage() {
  const timeline = await rows();
  return (
    <>
      <p className="kicker">Merger desk</p>
      <h1 className="page-title">Tesla and SpaceX.</h1>
      <p>
        <Chip chip="Discussed" /> Discussed publicly, and hinted at by Musk. Not announced. No agreement or SEC filing yet. The February 2026 deal joined xAI to SpaceX. It did not join Tesla.
      </p>
      <p className="note">
        Confirmed = on the record (filing, company, or Musk). Reported = a news report, often citing unnamed people. Speculation = analysts or prediction markets. Headline = pulled from the morning news, not yet reviewed. Newest first. Fresh headlines are added every morning.
      </p>
      <section className="section">
        <h2>What was said</h2>
        <ol className="mark-list">
          {timeline.map((item) => (
            <li key={`${item.iso}-${item.href}`}>
              <p className="mono">
                <Chip chip={item.chip} />
                {item.date} · {item.who}
              </p>
              <p>{item.text}</p>
              <a href={item.href} target="_blank" rel="noopener noreferrer">Source</a>
            </li>
          ))}
        </ol>
      </section>
      <section className="section">
        <h2>What would have to be true</h2>
        <ul className="question-list">
          {mergerQuestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="section">
        <h2>Why they stay separate</h2>
        <ul className="question-list">
          {mergerCounter.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
