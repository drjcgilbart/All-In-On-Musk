import type { Metadata } from "next";
import { DownloadCta } from "./download-cta";
import { FleetModelAnalytics } from "./ga";

const pageTitle = "Free Florida Tesla Fleet & Robotaxi Spreadsheet";
const pageDescription =
  "Download a free 5-year Orlando Model Y → Cybercab robotaxi fleet model. Blue-cell assumptions, FL fees, scenarios, P&L, IRR. Experimental — Year 1 doesn’t clear.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/projects/florida-fleet-model" },
  openGraph: {
    title: `${pageTitle} — All In On Musk`,
    description: pageDescription,
    url: "/projects/florida-fleet-model",
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

export default function FloridaFleetModelPage() {
  return (
    <>
      <FleetModelAnalytics />
      <p className="kicker">Projects · Free Excel · v1.1</p>
      <h1 className="page-title">Year 1 on the sheet does not clear.</h1>
      <p className="lede">
        Free 5-year Orlando model: fleet services + owning a Tesla Robotaxi fleet.
        Driven Model Ys first, Cybercabs from Year 3. Edit the blue cells. No email wall.
      </p>

      <div className="plain-card" style={{ marginBottom: "1.4rem", borderColor: "var(--desk-line-hot, #2ee6d6b8)" }}>
        <p>
          <strong>Honesty hook:</strong> Base case Year 1 EBITDA ≈ <strong>−$309k</strong>.
          Year 5 ≈ <strong>+$903k</strong> after robotaxi transition. Payback beyond 5.
          Network fee is a placeholder. Not Tesla-affiliated. Not advice.
        </p>
      </div>

      <DownloadCta location="top" wrapStyle={{ margin: "0 0 1.75rem" }} />

      <div
        className="section"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(10.5rem, 1fr))",
          gap: "0.75rem",
        }}
      >
        <div className="plain-card" style={{ minWidth: 0 }}>
          <p className="kicker">Y1 EBITDA</p>
          <h2 style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.45rem)", overflowWrap: "anywhere" }}>≈ −$309k</h2>
        </div>
        <div className="plain-card" style={{ minWidth: 0 }}>
          <p className="kicker">Y5 EBITDA</p>
          <h2 style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.45rem)", overflowWrap: "anywhere" }}>≈ $903k</h2>
        </div>
        <div className="plain-card" style={{ minWidth: 0 }}>
          <p className="kicker">Y5 fleet</p>
          <h2 style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.45rem)", overflowWrap: "anywhere" }}>16 / 20 RT</h2>
        </div>
      </div>

      <div className="section">
        <h2>What’s inside</h2>
        <p className="lede">
          Excel workbook with 10 sheets — Cover, Dashboard, Assumptions, Revenue, OpEx, Capital,
          Robotaxi Transition, Scenarios, Notes, Glossary — plus README.md, README.pdf, and LICENSE.
          Orlando seasonality, FL fees, purchase vs lease, in-house vs outsourced,
          Conservative/Base/Aggressive.
        </p>
      </div>

      <div className="section">
        <h2>Related on the desk</h2>
        <div className="stack">
          <a className="plain-card span-6" href="/projects/robotaxi"><p className="kicker">Lab</p><h2>Fleet lab</h2><p>Interactive Orlando sketch + published figures.</p></a>
          <a className="plain-card span-6" href="/projects"><p className="kicker">Index</p><h2>Projects</h2><p>Spreadsheet + staffing day.</p></a>
          <a className="plain-card span-6" href="/machines/tesla"><p className="kicker">01</p><h2>Tesla</h2><p>Company page on this desk.</p></a>
          <a className="plain-card span-6" href="/watch"><p className="kicker">Video</p><h2>Watch</h2><p>Videos on All In On Musk.</p></a>
        </div>
      </div>

      <div className="section">
        <h2>Caveats</h2>
        <p className="lede">
          Experimental educational model. Not financial, tax, insurance, legal, or investment advice.
          Not affiliated with Tesla. Cybercab price and network fee are placeholders.
          Straight-line depreciation, not MACRS. You own your decisions.
        </p>
        <DownloadCta location="bottom" wrapStyle={{ margin: "1rem 0 2.5rem" }} />
      </div>
    </>
  );
}
