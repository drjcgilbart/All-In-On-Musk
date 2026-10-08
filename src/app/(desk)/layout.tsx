import { Shell } from "@/components/shell";
import "./desk.css";

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
