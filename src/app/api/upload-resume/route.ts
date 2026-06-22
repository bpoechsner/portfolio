import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

function authorized(req: NextRequest): boolean {
  const token = req.headers.get("x-edit-token");
  return !!process.env.EDIT_PASSWORD && token === process.env.EDIT_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Resume must be a PDF" }, { status: 400 });
  }

  try {
    // Fixed pathname (overwritten each time) so the resume link never changes.
    const blob = await put("resume.pdf", file, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/pdf",
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    return NextResponse.json(
      { error: `Upload failed: ${String((err as Error).message ?? err)}` },
      { status: 500 }
    );
  }
}
