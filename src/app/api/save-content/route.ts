import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function authorized(req: NextRequest): boolean {
  const token = req.headers.get("x-edit-token");
  return !!process.env.EDIT_PASSWORD && token === process.env.EDIT_PASSWORD;
}

// Traverse obj by dot-notation path and set value.
// Array indices are supported: "experience.0.role"
function setAtPath(obj: unknown, dotPath: string, value: string): void {
  const keys = dotPath.split(".");
  let cur = obj as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    cur = cur[keys[i]] as Record<string, unknown>;
    if (cur == null) return; // path doesn't exist — skip silently
  }
  cur[keys[keys.length - 1]] = value;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { edits } = (await req.json()) as { edits: Record<string, string> };
  const contentPath = path.join(process.cwd(), "content.json");

  let content: unknown;
  try {
    content = JSON.parse(fs.readFileSync(contentPath, "utf-8"));
  } catch {
    return NextResponse.json({ error: "Could not read content.json" }, { status: 500 });
  }

  for (const [dotPath, value] of Object.entries(edits)) {
    setAtPath(content, dotPath, value);
  }

  try {
    fs.writeFileSync(contentPath, JSON.stringify(content, null, 2) + "\n");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not write content.json" }, { status: 500 });
  }
}
