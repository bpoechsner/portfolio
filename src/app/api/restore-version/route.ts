import { NextRequest, NextResponse } from "next/server";
import { restoreVersion } from "@/lib/content";

function authorized(req: NextRequest): boolean {
  const token = req.headers.get("x-edit-token");
  return !!process.env.EDIT_PASSWORD && token === process.env.EDIT_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { pathname } = (await req.json()) as { pathname?: string };
  if (!pathname) {
    return NextResponse.json({ error: "Missing pathname" }, { status: 400 });
  }
  try {
    await restoreVersion(pathname);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error).message ?? err) },
      { status: 500 }
    );
  }
}
