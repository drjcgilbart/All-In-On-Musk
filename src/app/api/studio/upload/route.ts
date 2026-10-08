import { NextResponse } from "next/server";
import { studioRequestAuthenticated } from "@/lib/studio/auth";
import { newId, saveUpload } from "@/lib/studio/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await studioRequestAuthenticated(request))) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a picture." }, { status: 400 });
  try {
    const url = await saveUpload(file);
    return NextResponse.json({ id: newId("img"), url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
