export type Chip =
  | "Confirmed"
  | "In production"
  | "Limited"
  | "Prototype"
  | "Announced"
  | "Reported"
  | "Rumor"
  | "Discussed"
  | "Stalled"
  | "Placeholder";

export type Program = {
  name: string;
  line: string;
  chip: Chip;
  text: string;
};

export type Machine = {
  slug: string;
  index: string;
  name: string;
  line: string;
  text: string;
  why: string;
  site: string;
  href: string;
  x: string;
  chips: { label: string; chip: Chip }[];
  programs: Program[];
  watch: string[];
};

export const machines: Machine[] = [
  {
    slug: "tesla",
    index: "01",
    name: "Tesla",
    line: "Drive itself.",
    text: "Cars, batteries, and energy that still works after dark.",
    why: "Tesla sells the car, the battery, and the software that tries to drive. The bet is that the same stack powers taxis, trucks, and the grid.",
    site: "tesla.com",
    href: "https://www.tesla.com",
    x: "https://x.com/tesla",
    chips: [
      { label: "Vehicles shipping", chip: "In production" },
      { label: "Unsupervised robotaxi", chip: "Reported" },
      { label: "Roadster, production 2028", chip: "Announced" },
    ],
    programs: [
      {
        name: "Vehicles",
        line: "Build the car.",
        chip: "In production",
        text: "Model S, 3, X, Y, and Cybertruck. Cybertruck is in production. Volume and margin still move quarter to quarter. Read the 10-Q, not the clip.",
      },
      {
        name: "Robotaxi / FSD",
        line: "Take the wheel.",
        chip: "Reported",
        text: "Supervised FSD is a shipping driver aid. Unsupervised ride service has been reported in narrow geofences. A Florida fleet model on this site is a workbook, not Tesla's plan.",
      },
      {
        name: "Semi",
        line: "Haul it.",
        chip: "In production",
        text: "Volume production started 24 Sep 2026 at the Semi factory in Sparks, Nevada. Tesla says the plant can build 50,000 a year. Capacity is not deliveries.",
      },
      {
        name: "Roadster",
        line: "Show the car.",
        chip: "Announced",
        text: "Revealed 15 Oct 2026 at McGregor, Texas. Reservations are open, no price. Tesla says production starts in 2028.",
      },
      {
        name: "Energy storage",
        line: "Store the night.",
        chip: "In production",
        text: "Megapack for utilities. Powerwall for buildings. This is a product line, not a slide.",
      },
      {
        name: "Solar",
        line: "Catch the noon.",
        chip: "In production",
        text: "Panels and Solar Roof sit under Tesla Energy. Roof volume has lagged the slide. Panels are the working business.",
      },
      {
        name: "Optimus",
        line: "Walk the floor.",
        chip: "Prototype",
        text: "A humanoid in prototype. Factory clips are not a shipping product.",
      },
      {
        name: "Dojo",
        line: "Train the net.",
        chip: "Reported",
        text: "Shut down in 2025. In Jan 2026 Musk said Dojo3 restarts, aimed at space-based compute. Status moves.",
      },
      {
        name: "Terafab",
        line: "Own the wafer.",
        chip: "Announced",
        text: "A chip fab sited in Grimes County, Texas, announced 6 Aug 2026. See the Terafab page.",
      },
    ],
    watch: [
      "Unsupervised miles inside a named geofence, from Tesla, not a fan map.",
      "Semi deliveries versus the 50,000-a-year plant.",
      "Megapack backlog, when Tesla prints it.",
      "Roadster: whether 2028 holds.",
    ],
  },
  {
    slug: "spacex",
    index: "02",
    name: "SpaceX",
    line: "Catch the booster.",
    text: "Starship, Starlink, and rockets that fly again.",
    why: "SpaceX flies the rocket and sells the connection. Starship is the vehicle. Starlink is the revenue line the street can see from the outside.",
    site: "spacex.com",
    href: "https://www.spacex.com",
    x: "https://x.com/spacex",
    chips: [
      { label: "Flight 14 orbit", chip: "Confirmed" },
      { label: "Company", chip: "Reported" },
      { label: "Nasdaq SPCX", chip: "Confirmed" },
    ],
    programs: [
      {
        name: "Starship",
        line: "Make orbit.",
        chip: "Confirmed",
        text: "Flight 14, Ship 41 on Booster 21, lifted off 28 Sep 2026 and was the first Starship stack to reach Earth orbit. SpaceX's own launch page is the source.",
      },
      {
        name: "Cadence",
        line: "Fly again.",
        chip: "Reported",
        text: "Falcon still flies the manifest. Starship cadence is the watch item. This desk does not invent the next window.",
      },
      {
        name: "Starlink",
        line: "Sell the sky.",
        chip: "In production",
        text: "The constellation is a working service. Flight 14 carried Starlink satellites. Subscriber counts belong to a filing, not a quote tweet.",
      },
      {
        name: "Direct to cell",
        line: "Skip the tower.",
        chip: "Reported",
        text: "Satellites talking to ordinary phones. Coverage and the carrier deals are the question. Tag it Reported until you are standing under it.",
      },
    ],
    watch: [
      "The next published Starship window. None is hardcoded here.",
      "What a filing says about Starlink versus launch. The SPCX print is not that split.",
      "Starlink direct-to-cell in a named city.",
    ],
  },
  {
    slug: "neuralink",
    index: "03",
    name: "Neuralink",
    line: "Read the signal.",
    text: "A medical implant. Judged by trials, not trailers.",
    why: "Neuralink is a medical device company. The only score that counts is a trial: safety, what the person can do, and whether a regulator agrees.",
    site: "neuralink.com",
    href: "https://neuralink.com",
    x: "https://x.com/neuralink",
    chips: [
      { label: "Human trials", chip: "Reported" },
      { label: "Consumer product", chip: "Stalled" },
    ],
    programs: [
      {
        name: "Implant",
        line: "Read the nerve.",
        chip: "Reported",
        text: "An implanted interface in human studies. Not FDA approved. Demos are not endpoints.",
      },
      {
        name: "Trials",
        line: "Count the patients.",
        chip: "Reported",
        text: "26 people had the N1 implant as of 22 Jun 2026, per Neuralink. Watch enrollment, adverse events, and the task the device claims.",
      },
    ],
    watch: [
      "Published trial updates from Neuralink or a registry.",
      "Any claim of a general consumer implant. That is not where the program is.",
    ],
  },
  {
    slug: "boring",
    index: "04",
    name: "The Boring Company",
    line: "Dig the road.",
    text: "Tunnels you can ride, not just render.",
    why: "The company digs a tunnel and runs a car through it. Vegas is the system you can ride. Everything else is a proposal until the hole is open.",
    site: "boringcompany.com",
    href: "https://www.boringcompany.com",
    x: "https://x.com/boringcompany",
    chips: [
      { label: "Vegas Loop", chip: "Limited" },
      { label: "Other cities", chip: "Discussed" },
    ],
    programs: [
      {
        name: "Vegas Loop",
        line: "Ride the tunnel.",
        chip: "Limited",
        text: "A working tunnel system in Las Vegas. Ridership claims need the company's own number.",
      },
      {
        name: "Next hole",
        line: "Permit it.",
        chip: "Discussed",
        text: "City names show up in pitches. A permit and a public opening are the chips that matter.",
      },
    ],
    watch: ["A second city with passengers, not a rendering.", "Cost per mile if the company ever prints it."],
  },
  {
    slug: "xai",
    index: "05",
    name: "xAI",
    line: "Ask the model.",
    text: "Grok, and the computers it runs on.",
    why: "xAI trains Grok and builds the machines under it. In February 2026 Reuters reported a combination with SpaceX. The product is still its own machine on this desk.",
    site: "x.ai",
    href: "https://x.ai",
    x: "https://x.com/xai",
    chips: [
      { label: "Grok", chip: "In production" },
      { label: "SpaceX combination", chip: "Reported" },
    ],
    programs: [
      {
        name: "Grok",
        line: "Ask the model.",
        chip: "In production",
        text: "The chatbot, inside X and in other products. Treat model claims as marketing until a test you can rerun says otherwise.",
      },
      {
        name: "Colossus",
        line: "Rack the chips.",
        chip: "Reported",
        text: "The training cluster's public name. GPU counts change in posts. Cite the post, don't memorize it.",
      },
      {
        name: "Terafab",
        line: "Own the wafer.",
        chip: "Discussed",
        text: "xAI is named with SpaceX and Tesla in the Terafab filings. Grimes County, Texas. See the Terafab page.",
      },
    ],
    watch: [
      "What the SpaceX combination actually changed: product, cap table, or only a press line.",
      "Colossus power and where the building sits.",
    ],
  },
  {
    slug: "terafab",
    index: "06",
    name: "Terafab",
    line: "Own the wafer.",
    text: "A chip plant with a site. Not a fab yet.",
    why: "Terafab is the chip complex for SpaceX, Tesla, and xAI. Texas announced the Grimes County site on 6 Aug 2026. Earthwork is under way. No wafer has shipped.",
    site: "tesla.com",
    href: "https://www.tesla.com",
    x: "https://x.com/tesla",
    chips: [
      { label: "Site, Grimes County TX", chip: "Confirmed" },
      { label: "Plant", chip: "Announced" },
    ],
    programs: [
      {
        name: "The idea",
        line: "Print the chip.",
        chip: "Discussed",
        text: "Own the wafer instead of buying every accelerator. Logic, memory, and packaging on one site.",
      },
      {
        name: "Phase one",
        line: "Pour the pad.",
        chip: "Announced",
        text: "$16.8 billion and 3,000 jobs in phase one, per Texas. Filings put operations in 2028. Site prep was seen in Oct 2026.",
      },
    ],
    watch: ["A tool order or a first wafer.", "Whether 2028 operations holds."],
  },
];

export function machineBySlug(slug: string) {
  return machines.find((machine) => machine.slug === slug);
}
