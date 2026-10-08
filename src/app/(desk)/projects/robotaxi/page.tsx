import type { Metadata } from "next";
import { FleetLab } from "@/components/fleet-lab";
import { money } from "@/lib/format";
import { workbook } from "@/lib/fleet-math";

export const metadata: Metadata = {
  title: "Robotaxi Florida",
  description: "A Florida fleet workbook and an hourly staffing sketch. Experimental. Not advice.",
  alternates: { canonical: "/projects/robotaxi" },
};

const sheetDay = workbook.y1Ebitda / workbook.days;

export default function RobotaxiPage() {
  return (
    <>
      <p className="kicker">Florida</p>
      <h1 className="page-title">Fleet lab.</h1>
      <p className="lede">
        Fleet model v1.1, dated 9 Sep 2026. Base case, cars purchased, work kept in house. The published year-1 EBITDA is <span className="nowrap">{money(workbook.y1Ebitda)}</span>. Spread over {workbook.days} days, that is about <span className="nowrap">{money(sheetDay)}</span> a day. A separate Wednesday readout of the Orlando fence, ten Model Ys, staffed as whole shifts, came out about <span className="nowrap">−$4,497</span>. These sliders recompute a simpler sketch. They will not reprint that Wednesday. Spreadsheet averages hide the shift that breaks the day.
      </p>
      <ul className="question-list">
        <li>Default paid miles are 4.89, the in-zone Orlando average. The workbook’s 16 trips and 148 paid miles do not both fit that fence.</li>
        <li>Wildwood, The Villages, and the I-75 shape are labeled assumed. The generic metro pack is assumed too.</li>
        <li>Orlando is the Semoran / Lee Vista evening shape from the readout, not a live dispatch feed.</li>
        <li>Take rate, network fee, Cybercab price, and residual are workbook inputs. The network fee is a placeholder. Residual is not in the day’s cash line. Florida registration is not modeled.</li>
        <li>Upload a CSV of 24 hourly weights. Save a workbook as CSV first. People still on the clock: drivers, cabin techs, charge techs, dispatch, and a remote operator once a robotaxi is in the fleet.</li>
      </ul>
      <div id="shifts" className="section">
        <FleetLab />
      </div>
    </>
  );
}
