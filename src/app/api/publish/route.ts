import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { getContent } from "@/lib/content";

function authorized(req: NextRequest): boolean {
  const token = req.headers.get("x-edit-token");
  return !!process.env.EDIT_PASSWORD && token === process.env.EDIT_PASSWORD;
}

// Content edits already go live immediately (they're read from Vercel Blob on
// every request — see src/lib/content.ts). This endpoint just snapshots the
// current live content into content.json and commits it, so git history
// keeps a record. It only works when run locally (or anywhere with git +
// push access) — on Vercel's read-only filesystem / no git checkout, it
// fails gracefully with an error instead of corrupting anything.
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cwd = process.cwd();

  try {
    const content = await getContent();
    fs.writeFileSync(path.join(cwd, "content.json"), JSON.stringify(content, null, 2) + "\n");

    execSync("git add content.json", { cwd, stdio: "pipe" });

    try {
      execSync('git commit -m "chore: snapshot live content from inline editor"', {
        cwd,
        stdio: "pipe",
      });
    } catch (err) {
      // "nothing to commit" is fine — just push whatever is already ahead of remote
      const msg = String((err as Error).message ?? "");
      if (
        !msg.includes("nothing to commit") &&
        !msg.includes("nothing added to commit")
      ) {
        throw err;
      }
    }

    execSync("git push", { cwd, stdio: "pipe" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = String((err as { stderr?: Buffer; message?: string }).stderr ?? (err as Error).message ?? err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
