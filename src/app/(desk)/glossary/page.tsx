import type { Metadata } from "next";
import { glossary } from "@/content/records";

export const metadata: Metadata = {
  title: "Glossary",
  description: "Short definitions for the shorthand on this desk.",
  alternates: { canonical: "/glossary" },
};

export default function GlossaryPage() {
  return (
    <>
      <p className="kicker">Glossary</p>
      <h1 className="page-title">Shorthand.</h1>
      <div className="glossary-list section">
        {glossary.map((item) => (
          <article key={item.term} id={item.term}>
            <h2>{item.term}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </>
  );
}
