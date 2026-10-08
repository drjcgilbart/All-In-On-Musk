import type { Metadata } from "next";
import { cookies } from "next/headers";
import { STUDIO_COOKIE, studioTokenMatches } from "@/lib/studio/auth";
import { readCatalog } from "@/lib/studio/catalog";
import { StudioClient } from "./studio-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Creator Studio",
  robots: { index: false, follow: false },
};

export default async function StudioPage() {
  const jar = await cookies();
  const authed = await studioTokenMatches(jar.get(STUDIO_COOKIE)?.value);
  const initialCatalog = authed ? await readCatalog() : null;
  return <StudioClient authed={authed} mode="studio" initialCatalog={initialCatalog} />;
}
