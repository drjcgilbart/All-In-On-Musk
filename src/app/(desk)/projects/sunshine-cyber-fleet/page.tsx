import type { Metadata } from "next";

const pageTitle = "Sunshine Cyber Fleet — Orlando Robotaxi Fleet Services";
const pageDescription =
  "Public overview of Sunshine Cyberfleet LLC: Central Florida operator concept for Tesla Robotaxi fleet services in Orlando, with a possible later Cybercab phase. Not affiliated with Tesla. Not an offer of securities.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/projects/sunshine-cyber-fleet" },
  openGraph: {
    title: `${pageTitle} — All In On Musk`,
    description: pageDescription,
    url: "/projects/sunshine-cyber-fleet",
    siteName: "All In On Musk",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "All In On Musk",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} — All In On Musk`,
    description: pageDescription,
    images: ["/opengraph-image"],
  },
};

export default function SunshineCyberFleetPage() {
  return (
    <>
      <p className="kicker">Projects · Operator overview · Public</p>
      <h1 className="page-title">Orlando fleet services first. Cybercabs when Tesla sells.</h1>
      <p className="lede">
        Sunshine Cyberfleet LLC is a Central Florida operator concept. Phase 1 starts on the ground
        Tesla already runs — charging, cleaning, inspecting, and recovering unsupervised Robotaxi
        Model Ys in Orlando — so that if Cybercabs are ever sold to third parties, Tesla already
        has a Florida operator who shows up.
      </p>

      <div className="plain-card" style={{ marginBottom: "1.4rem", borderColor: "var(--desk-line-hot, #2ee6d6b8)" }}>
        <p>
          <strong>Not Tesla. Not an offer.</strong> This page is informational only. Sunshine
          Cyberfleet is <strong>not affiliated with or endorsed by Tesla</strong>. Nothing here is
          an offer to sell or a solicitation to buy securities.
        </p>
      </div>

      <p>
        <a className="nav-btn" href="/projects/florida-fleet-model" style={{ borderColor: "var(--desk-line-hot, #2ee6d6b8)" }}>
          Free Florida Fleet Model (Excel)
        </a>{" "}
        <a className="nav-btn" href="/projects/robotaxi">
          Open interactive fleet lab
        </a>
      </p>

      <div
        className="section"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(10.5rem, 1fr))",
          gap: "0.75rem",
        }}
      >
        <div className="plain-card" style={{ minWidth: 0 }}>
          <p className="kicker">Home base</p>
          <h2 style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.45rem)", overflowWrap: "anywhere" }}>
            Central FL
          </h2>
        </div>
        <div className="plain-card" style={{ minWidth: 0 }}>
          <p className="kicker">Phase 1 floor</p>
          <h2 style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.45rem)", overflowWrap: "anywhere" }}>
            Orlando
          </h2>
        </div>
        <div className="plain-card" style={{ minWidth: 0 }}>
          <p className="kicker">Stage</p>
          <h2 style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.45rem)", overflowWrap: "anywhere" }}>
            Launch prep
          </h2>
        </div>
      </div>

      <div className="section">
        <h2>What Sunshine is</h2>
        <p className="lede">
          An independent Florida limited liability company preparing two related lines of work.
          First, depot and fleet-readiness services for Tesla-owned or Tesla-dispatched Robotaxi
          vehicles in Florida. Second, ownership of a small Cybercab fleet that would run on
          Tesla’s network only if Tesla selects the company and vehicles can actually be ordered.
          No consumer app. No competing marketplace. No lidar stack. Tesla already has the rider
          channel, the autonomy software, and the brand. The job is the unglamorous floor: uptime
          in heat, rain, and tourist peaks.
        </p>
      </div>

      <div className="section">
        <h2>Phase 1 — Orlando fleet services</h2>
        <p className="lede">
          Tesla Robotaxi has been unsupervised in eastern Orlando — Conway, Lee Vista, Semoran,
          bounded by the GreeneWay and the Beachline. Those Model Ys still need charging, cabin
          resets, inspection, and a local hand at 2 a.m. That is the door. Phase 1 is a lean crew
          against that live box — not a showroom and not a transformer-wait depot.
        </p>
        <div className="stack" style={{ marginTop: "1rem" }}>
          <div className="plain-card span-6">
            <p className="kicker">01</p>
            <h2>Charge and stage</h2>
            <p>Rotation plans so vehicles return to the network with usable range, not a last-mile limp to a public stall.</p>
          </div>
          <div className="plain-card span-6">
            <p className="kicker">02</p>
            <h2>Clean and reset</h2>
            <p>Cabin turnaround, exception cleaning, odor control, and a photo log so a car is guest-ready before the next ping.</p>
          </div>
          <div className="plain-card span-6">
            <p className="kicker">03</p>
            <h2>Inspect and document</h2>
            <p>Tire, glass, lighting, and cosmetic checks with a downtime record Tesla or an insurer can audit.</p>
          </div>
          <div className="plain-card span-6">
            <p className="kicker">04</p>
            <h2>Incident support</h2>
            <p>Local hands for a disabled vehicle, a weather hold, or a first-responder handoff — without inventing a competing app.</p>
          </div>
          <div className="plain-card span-6">
            <p className="kicker">05</p>
            <h2>Storm protocol</h2>
            <p>Pre-landfall pull-in, charging to a reserve state, and a written return-to-service checklist after a tropical event.</p>
          </div>
          <div className="plain-card span-6">
            <p className="kicker">06</p>
            <h2>Uptime reporting</h2>
            <p>A daily readiness sheet: available, charging, cleaning, in service, or down. Operators live on that list.</p>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Phase 2 — Cybercabs, if Tesla selects</h2>
        <p className="lede">
          After Tesla publishes third-party terms and already knows the Orlando floor shows up,
          Phase 2 may be owning roughly ten Cybercabs on Tesla’s network — only if Tesla selects
          operators and vehicles can actually be ordered. That is not a contract today. Tesla has
          not selected this company.
        </p>
      </div>

      <div className="section">
        <h2>Florida service areas, in plain words</h2>
        <p className="lede">
          Tesla Robotaxi is live in three Florida boxes today: Miami, Tampa, and Orlando. Sunshine’s
          Phase 1 floor is Orlando first — the Conway / Lee Vista / Semoran corridor — staged next
          to the live geofence, not next to Disney. Airports and theme parks sit outside those boxes
          for now. No fourth Florida city has been announced as of this writing.
        </p>
      </div>

      <div className="section">
        <h2>Crew and jobs</h2>
        <p className="lede">
          The concept hires adults who follow a photo checklist — cabin tech, charge and stage,
          on-call recovery, and an Orlando shift lead on the floor for the early months. A Central
          Florida manager can run dispatch and quality from The Villages once the local photo log
          is boring. Cheap untrained labor is how you lose the only customer that matters.
        </p>
      </div>

      <div className="section">
        <h2>Simulated fleet dashboard</h2>
        <p className="lede">
          A simulated fleet dashboard exists as a private preview on the Sunshine site — schedule,
          jobs, checklists, and incidents for the operator desk. It is not a live Tesla feed and it
          is not public on this desk.
        </p>
      </div>

      <div className="section">
        <h2>Where to go next</h2>
        <p className="lede">
          Start with the free educational spreadsheet on this desk. Full investor materials and the
          fleet dashboard stay private on Sunshine Cyber Fleet and require the existing sign-in.
        </p>
        <p>
          <a className="nav-btn" href="/projects/florida-fleet-model" style={{ borderColor: "var(--desk-line-hot, #2ee6d6b8)" }}>
            Free Florida Fleet Model (Excel)
          </a>
        </p>
        <p className="lede" style={{ marginTop: "1rem", fontSize: "0.95em" }}>
          Existing account holders:{" "}
          <a href="https://sunshinecyberfleet.com" rel="noopener noreferrer">
            sunshinecyberfleet.com
          </a>
        </p>
      </div>

      <div className="section">
        <h2>Disclaimer</h2>
        <p className="lede">
          Sunshine Cyberfleet LLC is an independent Florida company concept. It is not affiliated
          with, sponsored by, or endorsed by Tesla, Inc. This page is informational only and is not
          an offer to sell or a solicitation to buy securities. Network access, operator selection,
          Cybercab deliveries, and commercial terms are incomplete and are not represented as
          complete. Current stage is launch preparation.
        </p>
      </div>
    </>
  );
}
