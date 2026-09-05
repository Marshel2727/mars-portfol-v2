import "server-only";
import { cache } from "react";
import type { Project } from "@/types";

const backend = (process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

export const getServerProject = cache(async (id: number): Promise<Project | null | undefined> => {
  if (!Number.isSafeInteger(id) || id < 1) return null;
  try {
    const response = await fetch(`${backend}/api/projects/${id}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (response.status === 404) return null;
    if (!response.ok) return undefined;
    const payload = await response.json();
    return payload.data?.id === id && typeof payload.data?.title === "string" ? payload.data : undefined;
  } catch {
    // Preserve client retry during temporary API outages; do not turn them into 404s.
    return undefined;
  }
});

export async function getSitemapProjects(): Promise<Project[]> {
  const response = await fetch(`${backend}/api/projects/`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Project sitemap source unavailable");
  const payload = await response.json();
  if (!Array.isArray(payload.data)) throw new Error("Invalid project sitemap response");
  return payload.data;
}
