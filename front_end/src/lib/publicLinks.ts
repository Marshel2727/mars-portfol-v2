export function safePublicHref(value: string): string | undefined {
  const href = value.trim();
  if (/^https?:\/\//i.test(href)) {
    try { return new URL(href).href; } catch { return undefined; }
  }
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+/i.test(href)) return href;
  if (href.startsWith("/") && !href.startsWith("//") && !href.includes("\\")) return href;
  return undefined;
}

export function emailReplyHref(email: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Re: Diskusi Proyek - Marshel Portfolio")}`;
}
