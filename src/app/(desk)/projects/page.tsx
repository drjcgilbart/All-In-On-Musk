import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Working models for a Florida Tesla fleet. Experimental. Not advice.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <>
      <p className="kicker">Projects</p>
      <h1 className="page-title">The lab.</h1>
      <p className="lede">
        Working models for a Florida Tesla fleet, especially robotaxi and fleet service. Experimental. Wrong on purpose until proven. Not advice. Not Tesla’s plan.
      </p>
      <div className="stack section">
        <a className="plain-card span-6" href="/projects/florida-fleet-model">
          <p className="kicker">A</p>
          <h2>Spreadsheet</h2>
          <p>Fleet model v1.1, 9 Sep 2026. Base, purchase, in-house. Year 1 EBITDA on that sheet is negative.</p>
        </a>
        <a className="plain-card span-6" href="/projects/robotaxi#shifts">
          <p className="kicker">B</p>
          <h2>Staffing day</h2>
          <p>Same assumptions, whole shifts. Cars wait on people. The hour that goes negative is the point.</p>
        </a>
        <a className="plain-card span-6" href="/projects/sunshine-cyber-fleet">
          <p className="kicker">C</p>
          <h2>Sunshine Cyber Fleet</h2>
          <p>Public overview of a Central Florida Robotaxi fleet-services operator concept.</p>
        </a>
      </div>
    </>
  );
}
