import { head, put, list, del } from "@vercel/blob";
import staticContent from "../../content.json";

export type Content = typeof staticContent;
export type Experience = Content["experience"][number];
export type Project = Content["projects"][number];
export type ModelFile = Content["models"]["files"][number];
export type SkillCategory = Content["skills"][number];
export type Social = Content["socials"][number];
export type NavLink = Content["nav"]["links"][number];

const CONTENT_BLOB_PATH = "content.json";
const VERSIONS_PREFIX = "versions/";
const MAX_VERSIONS = 20;

// Vercel Blob's public CDN caches by URL regardless of cacheControlMaxAge,
// so a stable pathname can serve a stale edge copy for a few seconds after
// a write. Appending a cache-busting query param forces every read past
// the URL-keyed cache straight to origin.
function bust(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
}

// Live content lives in Vercel Blob so edits made on the deployed site take
// effect immediately, without a rebuild. content.json on disk is only the
// initial seed (and the snapshot that `Publish` writes back for git history).
export async function getContent(): Promise<Content> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return staticContent as Content;
  }
  try {
    const blob = await head(CONTENT_BLOB_PATH);
    const res = await fetch(bust(blob.url), { cache: "no-store" });
    if (res.ok) {
      return (await res.json()) as Content;
    }
  } catch {
    // No blob saved yet, or fetch failed — fall back to the bundled seed.
  }
  return staticContent as Content;
}

// Snapshots the content that's about to be overwritten, so edits can be
// undone. Best-effort: a snapshot failure should never block a save.
async function snapshotCurrentContent(): Promise<void> {
  try {
    const blob = await head(CONTENT_BLOB_PATH);
    const res = await fetch(bust(blob.url), { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.text();
    await put(`${VERSIONS_PREFIX}${new Date().toISOString().replace(/[:.]/g, "-")}.json`, json, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });
    await pruneOldVersions();
  } catch {
    // No existing content to snapshot yet — nothing to do.
  }
}

async function pruneOldVersions(): Promise<void> {
  const { blobs } = await list({ prefix: VERSIONS_PREFIX });
  if (blobs.length <= MAX_VERSIONS) return;
  const sorted = [...blobs].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
  const toDelete = sorted.slice(MAX_VERSIONS).map((b) => b.url);
  if (toDelete.length) await del(toDelete);
}

export async function saveContent(content: Content): Promise<void> {
  await snapshotCurrentContent();
  await put(CONTENT_BLOB_PATH, JSON.stringify(content, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

export interface ContentVersion {
  pathname: string;
  uploadedAt: string;
}

export async function listVersions(): Promise<ContentVersion[]> {
  const { blobs } = await list({ prefix: VERSIONS_PREFIX });
  return blobs
    .map((b) => ({ pathname: b.pathname, uploadedAt: b.uploadedAt as unknown as string }))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

export async function restoreVersion(pathname: string): Promise<void> {
  if (!pathname.startsWith(VERSIONS_PREFIX)) {
    throw new Error("Invalid version path");
  }
  const blob = await head(pathname);
  const res = await fetch(bust(blob.url), { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load that version");
  const content = (await res.json()) as Content;
  await saveContent(content);
}

export default staticContent;
