/** Source blocklist, allow list and topic screens for the live desk (src/lib/liveNews.ts). */

/**
 * Outlet blocklist: AllSides "Left" (not Lean Left), plus outlets MBFC/Ad Fontes rate Left / far left.
 * Matched on publisher domain and on source name.
 */
export const BLOCKED: { name: RegExp; domains: string[] }[] = [
  { name: /huff(ington)?\s?post/i, domains: ["huffpost.com", "huffingtonpost.com"] },
  { name: /mother jones/i, domains: ["motherjones.com"] },
  { name: /^the nation( on msn)?$/i, domains: ["thenation.com"] },
  { name: /jacobin/i, domains: ["jacobin.com"] },
  { name: /^salon/i, domains: ["salon.com"] },
  { name: /^slate/i, domains: ["slate.com"] },
  { name: /^vox( on msn)?$/i, domains: ["vox.com"] },
  { name: /msnbc|ms now/i, domains: ["msnbc.com", "ms.now"] },
  { name: /the intercept/i, domains: ["theintercept.com"] },
  { name: /daily beast/i, domains: ["thedailybeast.com"] },
  { name: /democracy now/i, domains: ["democracynow.org"] },
  { name: /raw ?story/i, domains: ["rawstory.com"] },
  { name: /alternet/i, domains: ["alternet.org"] },
  { name: /common dreams/i, domains: ["commondreams.org"] },
  { name: /truthout/i, domains: ["truthout.org"] },
  { name: /new republic/i, domains: ["newrepublic.com"] },
  { name: /rolling stone/i, domains: ["rollingstone.com"] },
  { name: /daily kos/i, domains: ["dailykos.com"] },
  { name: /guardian/i, domains: ["theguardian.com", "guardian.co.uk"] },
  { name: /new yorker/i, domains: ["newyorker.com"] },
  { name: /mediaite/i, domains: ["mediaite.com"] },
  { name: /the root/i, domains: ["theroot.com"] },
  { name: /the advocate/i, domains: ["advocate.com"] },
  { name: /pinknews/i, domains: ["thepinknews.com"] },
];
export const blockedOutlet = (source: string, href: string) => {
  let host = "";
  try { host = new URL(href).hostname.replace(/^www\./, ""); } catch {}
  return BLOCKED.some((b) => b.name.test(source) || b.domains.some((d) => host === d || host.endsWith("." + d)));
};

/** Topic screen on headline + description. Core company news (products, launches, earnings, recalls, regulation) is kept. */
export const TOPIC_LGBTQ = /\b(lgbt\w*|queer|transgender|trans (woman|women|man|men|people|rights|daughter|child)|nonbinary|non-binary|gender[- ]affirming|gender identity|pronouns?|drag (queen|show)|pride (month|flag|parade)|same-sex|gay|lesbian|bisexual|vivian (jenna )?wilson)\b/i;
export const TOPIC_LEFT_POLITICS = /\b(woke|dei|diversity,? equity|anti-?racis\w*|social justice|progressives?|democratic socialis\w*|aoc|ocasio-cortez|bernie sanders|tax the rich|billionaire tax|wealth tax|eat the rich|abolish|defund|climate justice|resist(ance)? movement|no kings|tesla takedown|boycott tesla|protest(s|ers)? (at|outside) tesla)\b/i;
/** Musk-bashing screen: attack/opinion framing, not reporting. */
export const BASHING = /\b(nazi|fascis\w*|salute|white suprema\w*|unhinged|meltdown|deranged|grifter|con ?man|hates? (elon|musk)|unfit|dangerous man|petulant|man-?child|ketamine|drug use)\b/i;
/** Anti-Tesla screen: doom/attack framing, not reporting. */
export const ANTI_TESLA = /\b(tesla is (doomed|dying|finished|a scam|a fraud)|tesla('s)? (collapse|death spiral|bubble|implod\w*)|sell (your )?tesla|dump (your )?tesla|worst car|tesla cult|fraud(ulent)? (full self-driving|fsd))\b/i;
/** Kept on purpose (mainstream, center, trade press). Informational; nothing here is blocked. */
export const ALLOWED = ["Reuters", "AP", "Bloomberg", "CNBC", "Wall Street Journal", "Teslarati", "Electrek", "BBC", "CBS News", "Forbes", "Newsweek", "Fox Business", "Yahoo Finance"];
export const CORE = /\b(recall|nhtsa|faa|fcc|sec filing|earnings|deliveries|revenue|launch(es|ed)?|price cut|lawsuit|court|regulat\w*|investigation|probe|crash|safety)\b/i;

