import type { MetadataRoute } from "next";
import { getSitemapProjects } from "@/lib/serverProjects";
import { siteUrl } from "@/lib/seo";

// Generate at request time so building never requires a running API.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getSitemapProjects();
  return [
    ...["", "/projects", "/skills", "/contact"].map((path) => ({ url: `${siteUrl}${path}` })),
    ...projects.filter((project) => Number.isSafeInteger(project.id) && project.id > 0)
      .map((project) => ({ url: `${siteUrl}/projects/${project.id}` })),
  ];
}
