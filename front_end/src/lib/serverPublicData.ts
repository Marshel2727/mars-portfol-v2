import "server-only";

const backend = (process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

export async function getPublicFallback(resources: string[]): Promise<Record<string, unknown>> {
  const entries = await Promise.all(resources.map(async (resource) => {
    try {
      const response = await fetch(`${backend}/api${resource}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(4000) });
      if (!response.ok) return null;
      const payload = await response.json();
      const data = payload.data;
      const valid = resource === "/projects/" || resource === "/skills/" || resource === "/certificates/"
        ? Array.isArray(data)
        : resource === "/about/" ? typeof data?.full_name === "string" : Boolean(data?.content);
      return valid ? [resource, data] as const : null;
    } catch {
      // Omit unavailable resources so SWR can retry on the client.
      return null;
    }
  }));
  return Object.fromEntries(entries.filter((entry) => entry !== null));
}
