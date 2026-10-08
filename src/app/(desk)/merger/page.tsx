import type { Metadata } from "next";
import { Chip } from "@/components/chip";
import { mergerCounter, mergerQuestions, mergerTimeline } from "@/content/records";

export const metadata: Metadata = {
  title: "Merger",
  description: "Public comments about a Tesla and SpaceX combination. Questions, not a prediction.",
  alternates: { canonical: "/merger" },
};

export default function MergerPage() {
  return (
    <>
      <p className="kicker">Merger desk</p>
      <h1 className="page-title">Tesla and SpaceX.</h1>
      <p>
        <Chip chip="Discussed" /> Discussed publicly. Not announced. Not a term sheet. The February 2026 report joined xAI to SpaceX. It did not join Tesla.
      </p>
      <section className="section">
        <h2>What was said</h2>
        <ol className="mark-list">
          {mergerTimeline.map((item) => (
            <li key={item.date}>
              <p className="mono">
                <Chip chip={item.chip} />
                {item.date} · {item.who}
              </p>
              <p>{item.text}</p>
              <a href={item.href}>Source</a>
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
