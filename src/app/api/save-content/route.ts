import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function authorized(req: NextRequest): boolean {
  const token = req.headers.get("x-edit-token");
  return !!process.env.EDIT_PASSWORD && token === process.env.EDIT_PASSWORD;
}

function setAtPath(obj: unknown, dotPath: string, value: unknown): void {
  const keys = dotPath.split(".");
  let cur = obj as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    cur = cur[keys[i]] as Record<string, unknown>;
    if (cur == null) return;
  }
  cur[keys[keys.length - 1]] = value;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    scalars?: Record<string, string>;
    arrays?: Record<string, string[]>;
    // legacy format — plain edits object sent before the array-controls update
    edits?: Record<string, string>;
  };

  const contentPath = path.join(process.cwd(), "content.json");

  let content: unknown;
  try {
    content = JSON.parse(fs.readFileSync(contentPath, "utf-8"));
  } catch {
    return NextResponse.json({ error: "Could not read content.json" }, { status: 500 });
  }

  // Support both new { scalars, arrays } format and legacy { edits } format
  const scalars = body.scalars ?? body.edits ?? {};
  const arrays = body.arrays ?? {};

  for (const [dotPath, value] of Object.entries(scalars)) {
    try { setAtPath(content, dotPath, value); } catch { /* skip bad paths */ }
  }
  for (const [dotPath, value] of Object.entries(arrays)) {
    try { setAtPath(content, dotPath, value); } catch { /* skip bad paths */ }
  }

  try {
    fs.writeFileSync(contentPath, JSON.stringify(content, null, 2) + "\n");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not write content.json" }, { status: 500 });
  }
}
