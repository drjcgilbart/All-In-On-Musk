import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PhoneViewStudio } from "@/components/phone-view-studio";
import { STUDIO_COOKIE, studioTokenMatches } from "@/lib/studio/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Phone view",
  robots: { index: false, follow: false },
};

export default async function PhoneViewPage() {
  const jar = await cookies();
  if (!(await studioTokenMatches(jar.get(STUDIO_COOKIE)?.value))) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<div className="phone-preview-loading">Loading phone view…</div>}>
      <PhoneViewStudio />
    </Suspense>
  );
}
