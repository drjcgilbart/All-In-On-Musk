import type { Metadata } from "next";
import { Chip } from "@/components/chip";
import { machineArt } from "@/content/art";
import { machines } from "@/content/machines";

export const metadata: Metadata = {
  title: "Machines",
  description: "Tesla, SpaceX, Neuralink, The Boring Company, xAI, and Terafab. Unofficial.",
  alternates: { canonical: "/machines" },
};

export default function MachinesPage() {
  return (
    <>
      <p className="kicker">Machines</p>
      <h1 className="page-title">Six machines.</h1>
      <p className="lede">Each card opens the desk page. The company site stays one click further out.</p>
      <div className="stack section">
        {machines.map((machine) => (
          <article className="machine-card" key={machine.slug}>
            <a className="card-hit" href={`/machines/${machine.slug}`}>
              <img className="card-shot" src={machineArt[machine.slug].src} alt={machineArt[machine.slug].alt} />
              <span className="idx">{machine.index}</span>
              <h2>{machine.name}</h2>
              <p className="line">{machine.line}</p>
              <p>{machine.why}</p>
            </a>
            <p className="chip-row">
              {machine.chips.map((item) => (
                <Chip key={item.label} chip={item.chip} />
              ))}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
