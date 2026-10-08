import type { Metadata } from "next";
import { Chip } from "@/components/chip";
import { machineBySlug } from "@/content/machines";

export const metadata: Metadata = {
  title: "Energy",
  description: "Tesla energy storage and solar, as carried on this desk.",
  alternates: { canonical: "/energy" },
};

export default function EnergyPage() {
  const tesla = machineBySlug("tesla");
  const programs = tesla?.programs.filter((program) => program.name === "Energy storage" || program.name === "Solar") ?? [];

  return (
    <>
      <p className="kicker">Energy</p>
      <h1 className="page-title">Store the night.</h1>
      <p className="lede">Megapack, Powerwall, and solar sit on the Tesla page. This is the short cut.</p>
      <div className="program-grid section">
        {programs.map((program) => (
          <article className="program" key={program.name}>
            <p className="kicker">{program.line}</p>
            <h3>{program.name}</h3>
            <Chip chip={program.chip} />
            <p>{program.text}</p>
          </article>
        ))}
      </div>
      <p>
        <a className="ext" href="/machines/tesla">
          Tesla machine
        </a>
      </p>
    </>
  );
}
