import { Shell } from "@/components/shell";
import { letterBannerCatalog } from "@/lib/letter/banner";
import "./desk.css";

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return <Shell letterBanners={letterBannerCatalog()}>{children}</Shell>;
}
