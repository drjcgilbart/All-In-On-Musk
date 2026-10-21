/** Public copy. The site stays unnamed. */

export const site = {
  name: "All In On Musk",
  seoTitle: "All In On Musk — unofficial Musk news desk",
  updatedLabel: "September 30, 2026",
  updatedIso: "2026-09-30",
  domain: "allinonmusk.com",
  url: "https://allinonmusk.com",
  description:
    "Unofficial Musk news desk for Tesla, SpaceX, xAI, Neuralink, and The Boring Company. Not investment, financial, or medical advice.",
  deck: "Five companies. One bet.",
  disclaimer:
    "Unofficial fan site. Not affiliated with Elon Musk, Tesla, SpaceX, Neuralink, The Boring Company, or xAI. Not investment, financial, or medical advice.",
} as const;

export const nav = [
  { href: "/", label: "Home" },
  { href: "/#stack", label: "Stack" },
  { href: "/machines", label: "Machines" },
  { href: "/markets", label: "Markets" },
  { href: "/news", label: "News" },
  { href: "/merger", label: "Merger" },
  { href: "/projects", label: "Projects" },
  { href: "/race/index.html", label: "Race" },
  { href: "/shop", label: "Merch" },
  { href: "/si-slopcore-videos", label: "SI Slopcore" },
  { href: "/about", label: "About" },
] as const;

export const moreNav = [
  { href: "/launches", label: "Launches" },
  { href: "/energy", label: "Energy" },
  { href: "/projects/robotaxi", label: "Robotaxi" },
  { href: "/glossary", label: "Glossary" },
  { href: "/x", label: "X feed" },
  { href: "/pictures", label: "Pictures" },
  { href: "/watch", label: "Videos" },
] as const;

export const tabs = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Markets" },
  { href: "/news", label: "News" },
  { href: "/machines", label: "Machines" },
  { href: "/projects", label: "Projects" },
  { href: "/shop", label: "Merch" },
] as const;
