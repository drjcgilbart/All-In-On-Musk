import { fetchLaunches } from "@/lib/launches";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const board = await fetchLaunches();
  return NextResponse.json(board);
}
