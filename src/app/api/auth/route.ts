import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password: string };
  const correct = process.env.EDIT_PASSWORD;

  if (!correct) {
    return NextResponse.json({ error: "EDIT_PASSWORD env var not set" }, { status: 500 });
  }
  if (password === correct) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
