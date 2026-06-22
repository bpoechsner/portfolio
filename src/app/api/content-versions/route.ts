import { NextRequest, NextResponse } from "next/server";
import { listVersions } from "@/lib/content";

function authorized(req: NextRequest): boolean {
  const token = req.headers.get("x-edit-token");
  return !!process.env.EDIT_PASSWORD && token === process.env.EDIT_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const versions = await listVersions();
    return NextResponse.json({ ok: true, versions });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error).message ?? err) },
      { status: 500 }
    );
  }
}
