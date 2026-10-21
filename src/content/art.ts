export type Frame = { src: string; alt: string };

export const frames = {
  rocket: {
    src: "/art/rocket.jpg",
    alt: "Polished steel rocket with lattice fins on a dry lakebed",
  },
  climb: {
    src: "/art/climb.jpg",
    alt: "A stainless rocket climbing off a dry lakebed at dusk",
  },
  pod: {
    src: "/art/pod.jpg",
    alt: "Compact autonomous shuttle on a wet night street",
  },
  pickup: {
    src: "/art/pickup.jpg",
    alt: "Brushed stainless work truck with a separate bed",
  },
  coupe: {
    src: "/art/coupe.jpg",
    alt: "Low red coupe on a coastal road at night",
  },
  borer: {
    src: "/art/borer.jpg",
    alt: "Tunnel boring machine cutterhead inside a concrete tunnel",
  },
  surgeon: {
    src: "/art/surgeon.jpg",
    alt: "A single precision robot arm over sterile drapes",
  },
  racks: {
    src: "/art/racks.jpg",
    alt: "A long hall of dark server racks",
  },
  cleanroom: {
    src: "/art/cleanroom.jpg",
    alt: "An amber cleanroom with wafer tools",
  },
  yard: {
    src: "/art/yard.jpg",
    alt: "Solar arrays beside white battery containers at sunrise",
  },
  screens: {
    src: "/art/screens.jpg",
    alt: "A desk of monitors glowing green and red",
  },
  campus: {
    src: "/art/campus.jpg",
    alt: "An oceanside industrial campus at night",
  },
  console: {
    src: "/art/console.jpg",
    alt: "A dark control console under a cyan lamp",
  },
  starship: {
    src: "/art/starship.jpg",
    alt: "Stainless ship lifting off beside a launch tower",
  },
  robotaxi: {
    src: "/art/robotaxi.jpg",
    alt: "Gold two-seat robotaxi with the doors open on a wet street",
  },
  optimus: {
    src: "/art/optimus.jpg",
    alt: "Champagne-and-black humanoid robot in a factory aisle",
  },
  cybertruck: {
    src: "/art/cybertruck.jpg",
    alt: "Angular stainless pickup on open ground",
  },
  dragon: {
    src: "/art/dragon.jpg",
    alt: "White crew capsule with a black heat shield over the ocean",
  },
  terafab: {
    src: "/art/terafab.jpg",
    alt: "Finished Texas chip campus with light bands, an elevated road, and a reflecting pool",
  },
  modely: {
    src: "/art/modely.jpg",
    alt: "White electric crossover on a coastal road",
  },
  heavy: {
    src: "/art/heavy.jpg",
    alt: "Three-core heavy rocket lifting off a coastal pad",
  },
  floor: {
    src: "/art/floor.jpg",
    alt: "A stock exchange trading floor under a wall of charts",
  },
} as const satisfies Record<string, Frame>;

export const machineArt: Record<string, Frame> = {
  tesla: frames.cybertruck,
  spacex: frames.dragon,
  neuralink: frames.surgeon,
  boring: frames.borer,
  xai: frames.racks,
  terafab: frames.terafab,
};

/** One or more stills for the desk banner. Add a frame here when a page needs its own picture. */
export function pageFrames(pathname: string): Frame[] {
  if (pathname.startsWith("/si-slopcore-videos")) return [{ src: "/art/slopcore-banner.svg", alt: "SI Slopcore banner: glowing red equalizer and waveform over a circuit grid" }];
  if (pathname === "/" || pathname === "/machines") return [frames.starship, frames.robotaxi, frames.optimus];
  if (pathname.startsWith("/machines/tesla")) return [frames.cybertruck, frames.robotaxi, frames.modely];
  if (pathname.startsWith("/machines/spacex") || pathname.startsWith("/launches")) return [frames.starship, frames.heavy];
  if (pathname.startsWith("/machines/neuralink")) return [frames.surgeon];
  if (pathname.startsWith("/machines/boring")) return [frames.borer];
  if (pathname.startsWith("/machines/xai")) return [frames.racks];
  if (pathname.startsWith("/machines/terafab")) return [frames.terafab];
  if (pathname.startsWith("/projects")) return [frames.robotaxi, frames.modely];
  if (pathname.startsWith("/energy")) return [frames.yard];
  if (pathname.startsWith("/markets")) return [frames.floor];
  if (pathname.startsWith("/news") || pathname.startsWith("/watch")) return [frames.screens];
  if (pathname.startsWith("/merger")) return [frames.heavy, frames.racks];
  if (pathname.startsWith("/about")) return [frames.campus];
  if (pathname.startsWith("/pictures")) return [frames.modely, frames.robotaxi, frames.borer];
  if (pathname.startsWith("/journal") || pathname.startsWith("/glossary") || pathname.startsWith("/x")) return [frames.console];
  if (pathname.startsWith("/login") || pathname.startsWith("/admin") || pathname.startsWith("/studio")) return [frames.console];
  return [frames.campus];
}
