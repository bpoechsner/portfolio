import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

function authorized(req: NextRequest): boolean {
  const token = req.headers.get("x-edit-token");
  return !!process.env.EDIT_PASSWORD && token === process.env.EDIT_PASSWORD;
}

// Note: this endpoint only works in local dev (or any environment with git + push access).
// On Vercel's read-only filesystem, git commands will fail.
// The intended workflow: run locally, publish pushes to GitHub, Vercel auto-deploys.
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cwd = process.cwd();

  try {
    execSync("git add content.json", { cwd, stdio: "pipe" });

    try {
      execSync('git commit -m "chore: update content via inline editor"', {
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
