import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";

function authorized(req: NextRequest): boolean {
  const token = req.headers.get("x-edit-token");
  return !!process.env.EDIT_PASSWORD && token === process.env.EDIT_PASSWORD;
}

const ALLOWED_EXT = [".stl", ".glb", ".gltf", ".3mf", ".obj"];

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type. Use: ${ALLOWED_EXT.join(", ")}` },
      { status: 400 }
    );
  }

  const safeBase = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .slice(0, 60);
  const filename = `${Date.now()}-${safeBase}${ext}`;

  try {
    const blob = await put(`uploads/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return NextResponse.json({ ok: true, url: blob.url, format: ext.slice(1).toUpperCase() });
  } catch (err) {
    return NextResponse.json(
      { error: `Upload failed: ${String((err as Error).message ?? err)}` },
      { status: 500 }
    );
  }
}
