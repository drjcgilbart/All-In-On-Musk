import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chip } from "@/components/chip";
import { NewsList } from "@/components/news-list";
import { machineBySlug, machines } from "@/content/machines";
import { news } from "@/content/news";

const tagFor: Record<string, string> = {
  boring: "Boring",
  xai: "xAI",
};

export function generateStaticParams() {
  return machines.map((machine) => ({ slug: machine.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const machine = machineBySlug(slug);
  if (!machine) return { title: "Machine" };
  return {
    title: machine.name,
    description: `${machine.line} ${machine.why}`,
    alternates: { canonical: `/machines/${machine.slug}` },
  };
}

export default async function MachinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const machine = machineBySlug(slug);
  if (!machine) notFound();
  const tag = tagFor[machine.slug] ?? machine.name;
  const items = news.filter((item) => item.tags.includes(tag));

  return (
    <>
      <p className="kicker">
        {machine.index} · {machine.line}
      </p>
      <h1 className="page-title">{machine.name}</h1>
      <p className="lede">{machine.why}</p>
      <p className="chip-row">
        {machine.chips.map((item) => (
          <span key={item.label}>
            <Chip chip={item.chip} />
            {item.label}
          </span>
        ))}
      </p>
      <div className="program-grid section">
        {machine.programs.map((program) => (
          <article className="program" key={program.name}>
            <p className="kicker">{program.line}</p>
            <h3>{program.name}</h3>
            <Chip chip={program.chip} />
            <p>{program.text}</p>
          </article>
        ))}
      </div>
      <section className="section">
        <h2>Open questions</h2>
        <ul className="question-list">
          {machine.watch.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="section">
        <h2>On the desk</h2>
        <NewsList items={items} showFilters={false} />
      </section>
      <p className="chip-row section">
        <a className="ext" href={machine.href}>
          {machine.site}
        </a>
        <a className="ext" href={machine.x}>
          X account
        </a>
        {machine.slug === "tesla" || machine.slug === "xai" ? (
          <a className="ext" href="/machines/terafab">
            Terafab
          </a>
        ) : null}
        {machine.slug === "tesla" ? (
          <a className="ext" href="/energy">
            Energy
          </a>
        ) : null}
      </p>
    </>
  );
}
