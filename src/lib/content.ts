import { head, put } from "@vercel/blob";
import staticContent from "../../content.json";

export type Content = typeof staticContent;
export type Experience = Content["experience"][number];
export type Project = Content["projects"][number];
export type ModelFile = Content["models"]["files"][number];
export type SkillCategory = Content["skills"][number];
export type Social = Content["socials"][number];
export type NavLink = Content["nav"]["links"][number];

const CONTENT_BLOB_PATH = "content.json";

// Live content lives in Vercel Blob so edits made on the deployed site take
// effect immediately, without a rebuild. content.json on disk is only the
// initial seed (and the snapshot that `Publish` writes back for git history).
export async function getContent(): Promise<Content> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return staticContent as Content;
  }
  try {
    const blob = await head(CONTENT_BLOB_PATH);
    const res = await fetch(blob.url, { cache: "no-store" });
    if (res.ok) {
      return (await res.json()) as Content;
    }
  } catch {
    // No blob saved yet, or fetch failed — fall back to the bundled seed.
  }
  return staticContent as Content;
}

export async function saveContent(content: Content): Promise<void> {
  await put(CONTENT_BLOB_PATH, JSON.stringify(content, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

export default staticContent;
