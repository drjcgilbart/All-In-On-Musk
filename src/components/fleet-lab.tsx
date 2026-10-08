"use client";

import { defaults, packs, runDay, workbook, type FleetInput, type PackId } from "@/lib/fleet-math";
import { money } from "@/lib/format";
import { useMemo, useState } from "react";

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  return (
    <label className="slider">
      <span>
        {label}
        <strong>{format(value)}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function FleetLab() {
  const [input, setInput] = useState<FleetInput>(defaults);
  const day = useMemo(() => runDay(input), [input]);
  const set = (patch: Partial<FleetInput>) => setInput((current) => ({ ...current, ...patch }));
  let running = 0;

  const csv = () => {
    const header = "hour,demand,trips,unmet,revenue,labor,contrib";
    const lines = day.hours.map(
      (row) =>
        `${row.hour},${row.demand.toFixed(2)},${row.trips.toFixed(2)},${row.unmet.toFixed(2)},${row.revenue.toFixed(2)},${row.labor.toFixed(2)},${row.contrib.toFixed(2)}`,
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "florida-day.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const weights = text
      .split(/\r?\n/)
      .map((line) => line.split(",")[1] ?? line.split(",")[0])
      .map((cell) => Number(String(cell).trim()))
      .filter((value) => Number.isFinite(value));
    if (weights.length >= 24) set({ shape: weights.slice(0, 24) });
  };

  return (
    <div className="lab">
      <div className="lab-controls">
        <label className="slider">
          <span>Scenario pack</span>
          <select value={input.pack} onChange={(event) => set({ pack: event.target.value as PackId, shape: undefined })}>
            {packs.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.label}
              </option>
            ))}
          </select>
        </label>
        <p className="note">{packs.find((pack) => pack.id === input.pack)?.note}</p>
        <Slider label="Driven cars" value={input.driven} min={0} max={40} step={1} onChange={(driven) => set({ driven })} format={(value) => String(value)} />
        <Slider label="Robotaxis" value={input.robotaxi} min={0} max={40} step={1} onChange={(robotaxi) => set({ robotaxi })} format={(value) => String(value)} />
        <Slider label="Utilization" value={input.utilization} min={0.5} max={1.5} step={0.05} onChange={(utilization) => set({ utilization })} format={(value) => value.toFixed(2)} />
        <Slider label="Fare / trip" value={input.fare} min={8} max={40} step={0.25} onChange={(fare) => set({ fare })} format={(value) => money(value, 2)} />
        <Slider label="Paid miles / trip" value={input.tripMiles} min={2} max={12} step={0.1} onChange={(tripMiles) => set({ tripMiles })} format={(value) => value.toFixed(2)} />
        <Slider label="Take rate" value={input.netTake} min={0.5} max={1} step={0.01} onChange={(netTake) => set({ netTake })} format={(value) => `${Math.round(value * 100)}%`} />
        <Slider label="Driver wage / hour" value={input.wage} min={14} max={40} step={0.5} onChange={(wage) => set({ wage })} format={(value) => money(value, 2)} />
        <Slider label="Insurance / car / year" value={input.insuranceYear} min={2000} max={12000} step={100} onChange={(insuranceYear) => set({ insuranceYear })} format={(value) => money(value)} />
        <Slider label="Energy / mile" value={input.energyPerMile} min={0.02} max={0.2} step={0.005} onChange={(energyPerMile) => set({ energyPerMile })} format={(value) => money(value, 3)} />
        <Slider label="Vehicle price" value={input.vehiclePrice} min={20000} max={80000} step={500} onChange={(vehiclePrice) => set({ vehiclePrice })} format={(value) => money(value)} />
        <Slider label="Depot + office / month" value={input.fixedMonth} min={2000} max={25000} step={100} onChange={(fixedMonth) => set({ fixedMonth })} format={(value) => money(value)} />
        <Slider label="Deadhead ratio" value={input.deadhead} min={0.1} max={1.2} step={0.05} onChange={(deadhead) => set({ deadhead })} format={(value) => value.toFixed(2)} />
        <Slider label="No-show" value={input.noShow} min={0} max={0.3} step={0.01} onChange={(noShow) => set({ noShow })} format={(value) => `${Math.round(value * 100)}%`} />
        <label className="check">
          <input type="checkbox" checked={input.weekend} onChange={(event) => set({ weekend: event.target.checked })} />
          Weekend wage premium, 1.25×
        </label>
        <label className="slider">
          <span>Hourly demand CSV</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              void onFile(event.target.files?.[0]);
            }}
          />
        </label>
        <div className="lab-actions">
          <button type="button" onClick={() => window.print()}>
            Print / PDF
          </button>
          <button type="button" onClick={csv}>
            Download CSV
          </button>
          <button type="button" onClick={() => setInput(defaults)}>
            Reset
          </button>
        </div>
      </div>

      <div className="lab-read">
        <section className="panel">
          <p className="kicker">Published workbook</p>
          <h2>v1.1 does not make year 1.</h2>
          <p>
            {workbook.version}. {workbook.scenario}. These figures are the sheet. Sliders do not rewrite them.
          </p>
          <dl className="facts">
            <div>
              <dt>Y1 net revenue</dt>
              <dd>{money(workbook.y1Revenue)}</dd>
            </div>
            <div>
              <dt>Y1 EBITDA</dt>
              <dd>{money(workbook.y1Ebitda)}</dd>
            </div>
            <div>
              <dt>Y1 net income</dt>
              <dd>{money(workbook.y1Net)}</dd>
            </div>
            <div>
              <dt>Y5 EBITDA</dt>
              <dd>{money(workbook.y5Ebitda)}</dd>
            </div>
          </dl>
          <p className="note">
            Year 1 is 10 driven cars and no robotaxi. Year 5 on the sheet is {workbook.y5Driven} driven and {workbook.y5Robotaxi} robotaxi, EBITDA {money(workbook.y5Ebitda)}. Payback on the sheet is beyond five years. Network fee {Math.round(workbook.networkFee * 100)}% is a placeholder.
          </p>
        </section>

        <section className="panel">
          <p className="kicker">This sketch</p>
          <h2>Sheet day against shift day.</h2>
          <div className="compare">
            <div>
              <h3>Smoothed sheet</h3>
              <dl className="facts">
                <div>
                  <dt>Revenue</dt>
                  <dd>{money(day.sheet.revenue)}</dd>
                </div>
                <div>
                  <dt>Labor</dt>
                  <dd>{money(day.sheet.labor)}</dd>
                </div>
                <div>
                  <dt>EBITDA-like</dt>
                  <dd>{money(day.sheet.ebitda)}</dd>
                </div>
              </dl>
              <p className="note">
                Driver hours stay at {workbook.sheetDriverHours} per car. Dispatch and cleaning are fractions of a person. Paid miles are {input.tripMiles.toFixed(2)}, so fare per paid mile is {money(input.fare / input.tripMiles, 2)}. Residual {Math.round(workbook.residual * 100)}% is on the workbook and not in this day. Florida registration is not a line here.
              </p>
            </div>
            <div>
              <h3>Whole shifts</h3>
              <dl className="facts">
                <div>
                  <dt>Revenue</dt>
                  <dd>{money(day.sim.revenue)}</dd>
                </div>
                <div>
                  <dt>Labor</dt>
                  <dd>{money(day.sim.labor)}</dd>
                </div>
                <div>
                  <dt>After trip costs</dt>
                  <dd>{money(day.sim.revenue - day.sim.energy - day.sim.maint - day.sim.fee)}</dd>
                </div>
                <div>
                  <dt>EBITDA-like</dt>
                  <dd>{money(day.sim.ebitda)}</dd>
                </div>
                <div>
                  <dt>Cash after sketch debt</dt>
                  <dd>{money(day.sim.ebitda - day.debtDay)}</dd>
                </div>
                <div>
                  <dt>Unmet trips</dt>
                  <dd>{day.sim.unmet.toFixed(1)}</dd>
                </div>
                <div>
                  <dt>Sketch debt / day</dt>
                  <dd>{money(day.debtDay)}</dd>
                </div>
              </dl>
              <p className="note">
                Two driver waves, cabin techs, a charge tech, dispatch. Cash after the sketch debt service is {money(day.sim.ebitda - day.debtDay)}. Debt here is {Math.round(workbook.loanShare * 100)}% of sticker at {workbook.apr * 100}% for {workbook.termMonths} months. A sketch, not the workbook IRR.
              </p>
            </div>
          </div>
        </section>

        <section className="panel">
          <p className="kicker">Staffing</p>
          <h2>Who is on the clock.</h2>
          <div className="gantt" role="table" aria-label="Staffing by hour">
            {["Drivers", "Cabin", "Charge", "Dispatch", "Remote"].map((role) => (
              <div className="gantt-row" key={role}>
                <span>{role}</span>
                {day.hours.map((row) => {
                  const count =
                    role === "Drivers"
                      ? row.drivers
                      : role === "Cabin"
                        ? row.cabin
                        : role === "Charge"
                          ? row.charge
                          : role === "Dispatch"
                            ? row.dispatch
                            : row.remote;
                  return (
                    <i key={row.hour} className={count > 0 ? "on" : ""} title={`${role} ${row.hour}:00 · ${count}`} />
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mono gantt-hours">00 02 04 06 08 10 12 14 16 18 20 22</p>
        </section>

        <section className="panel">
          <p className="kicker">24-hour P&amp;L</p>
          <h2>Cumulative, not a blend.</h2>
          <div className="day-table">
            <table>
              <thead>
                <tr>
                  <th>Hour</th>
                  <th>Trips</th>
                  <th>Unmet</th>
                  <th>Revenue</th>
                  <th>Labor</th>
                  <th>Net</th>
                  <th>Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {day.hours.map((row) => {
                  running += row.contrib;
                  const red = row.contrib < 0;
                  return (
                    <tr key={row.hour} className={red ? "neg" : ""}>
                      <td className="mono">{String(row.hour).padStart(2, "0")}</td>
                      <td>{row.trips.toFixed(1)}</td>
                      <td>{row.unmet.toFixed(1)}</td>
                      <td>{money(row.revenue)}</td>
                      <td>{money(row.labor)}</td>
                      <td>{money(row.contrib)}</td>
                      <td>{money(running)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
