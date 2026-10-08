import type { Metadata } from "next";
import { ny } from "@/lib/format";
import { fetchLaunches } from "@/lib/launches";

export const metadata: Metadata = {
  title: "Launches",
  description: "SpaceX launches in the next seven days, plus Starship Flight 14.",
  alternates: { canonical: "/launches" },
};

export const dynamic = "force-dynamic";

export default async function LaunchesPage() {
  const board = await fetchLaunches();
  return (
    <>
      <p className="kicker">Launch board</p>
      <h1 className="page-title">Next seven days.</h1>
      {board.stale ? <p className="mono">LAUNCH FEED STALE</p> : null}
      {board.launches.length === 0 && !board.stale ? (
        <p className="lede">No SpaceX launch is scheduled in the next seven days.</p>
      ) : null}
      <ol className="mark-list">
        {board.launches.map((launch) => (
          <li key={launch.id}>
            <p className="mono">
              {launch.name}
              {launch.status ? ` · ${launch.status}` : ""}
            </p>
            <p>{ny(launch.net)}</p>
          </li>
        ))}
      </ol>
      <section className="section">
      <h2>Flight 14 flew.</h2>
      <img
        className="ship-still"
        src="/starship-flight-14.jpg"
        alt="Likeness of Starship Flight 14, Ship 41 stacked on Booster 21, climbing off the pad."
      />
      <p className="lede">
        28 Sep 2026, 12:48 UTC. Ship 41 on Super Heavy Booster 21, from Pad 2 at Starbase. SpaceX’s launch page says the stack reached Earth orbit and deployed Starlink satellites. The booster came down in the Gulf. The ship came down in the Pacific.
      </p>
      <p>
        <a className="ext" href="https://www.spacex.com/launches/starship-flight-14">
          spacex.com launch page
        </a>
      </p>
      </section>
    </>
  );
}
