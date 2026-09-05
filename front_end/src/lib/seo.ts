export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://v2.marshelportfolio.me").replace(/\/$/, "");

export function publicImageUrl(value?: string): string {
  if (!value) return `${siteUrl}/opengraph-image`;
  try {
    const url = new URL(value, `${siteUrl}/`);
    return ["http:", "https:"].includes(url.protocol) ? url.href : `${siteUrl}/opengraph-image`;
  } catch {
    return `${siteUrl}/opengraph-image`;
  }
}
