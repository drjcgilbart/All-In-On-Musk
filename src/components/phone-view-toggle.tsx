"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/** Top-bar phone preview. Render only for a signed-in admin. */
export function PhoneViewToggle() {
  const pathname = usePathname();
  const search = useSearchParams();

  if (pathname === "/phone-view") return null;

  const from = `${pathname}${search.toString() ? `?${search.toString()}` : ""}`;

  return (
    <Link
      href={`/phone-view?from=${encodeURIComponent(from)}`}
      className="nav-btn phone-view-btn"
      title="Preview this page at iPhone and Android sizes"
    >
      Phone view
    </Link>
  );
}
