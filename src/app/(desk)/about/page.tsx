import type { Metadata } from "next";
import { Chip } from "@/components/chip";
import { milestones } from "@/content/records";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: site.disclaimer,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <p className="kicker">About</p>
      <h1 className="page-title">A fan desk.</h1>
      <p className="lede">{site.disclaimer}</p>
      <p className="lede">
        Five companies, plus the fab that is still a sentence. Markets are prints. News is only what this desk can link. Journal, pictures, and videos are pages added on this desk. The Florida pages are a workbook and a staffing sketch. Race is Tesla World Racer, an unofficial fan game with stylized cars.
      </p>
      <section className="section">
        <h2>The record</h2>
        <ol className="mark-list">
          {milestones.map((item) => (
            <li key={item.href}>
              <p className="mono">
                <Chip chip={item.chip} />
                {item.date}
              </p>
              <a href={item.href}>{item.text}</a>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
