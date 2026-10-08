import { fetchBoard, fetchPrint, isRange } from "@/lib/quotes";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const range = searchParams.get("range");
  try {
    if ((symbol === "TSLA" || symbol === "SPCX") && isRange(range)) {
      const name = symbol === "TSLA" ? "Tesla" : "SpaceX";
      const print = await fetchPrint(symbol, name, range);
      return NextResponse.json({ source: "yahoo", stale: false, print });
    }
    const board = await fetchBoard();
    return NextResponse.json(board);
  } catch {
    return NextResponse.json({
      source: "none",
      stale: true,
      fetchedAt: new Date().toISOString(),
      indices: [],
      tsla: null,
      spcx: null,
      note: "FEED STALE",
    });
  }
}
