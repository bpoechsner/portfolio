import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bpoechsner.vercel.app";
  const content = await getContent();

  const staticRoutes = ["", "/experience", "/projects", "/3d-files", "/skills", "/contact"].map(
    (route) => ({
      url: `${siteUrl}${route}`,
      lastModified: new Date(),
    })
  );

  const projectRoutes = content.projects.map((p) => ({
    url: `${siteUrl}/projects/${p.id}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...projectRoutes];
}
