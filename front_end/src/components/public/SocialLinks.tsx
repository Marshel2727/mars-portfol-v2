"use client";

import Link from "next/link";
import { safePublicHref } from "@/lib/publicLinks";
import { useSiteContent } from "./SiteContentProvider";

type SocialEntry = { label: string; href: string };

function findSocialHref(
  links: SocialEntry[],
  labelPattern: RegExp,
  hostPattern: RegExp
): string | undefined {
  for (const link of links) {
    const label = (link.label || "").trim();
    const rawHref = (link.href || "").trim();
    const normalized = /^wa\.me\//i.test(rawHref) ? `https://${rawHref}` : rawHref;
    const href = safePublicHref(normalized);
    if (!href) continue;
    if (labelPattern.test(label) || hostPattern.test(href)) {
      return href;
    }
  }
  return undefined;
}

const TELEMETRY_CHANNELS = [
  {
    id: "instagram",
    name: "Instagram",
    labelPattern: /\b(instagram|ig)\b/i,
    hostPattern: /instagram\.com|instagr\.am/i,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    name: "TikTok",
    labelPattern: /\btik\s*tok\b/i,
    hostPattern: /tiktok\.com/i,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
      </svg>
    ),
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    labelPattern: /\b(whatsapp|wa)\b/i,
    hostPattern: /wa\.me|whatsapp\.com/i,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2a9.94 9.94 0 0 0-8.6 14.92L2 22l5.25-1.38A9.95 9.95 0 1 0 12.04 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.11.82.83-3.03-.2-.31a8.23 8.23 0 1 1 6.96 3.84Zm4.51-6.15c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.19-.54.06a6.73 6.73 0 0 1-1.98-1.22 7.45 7.45 0 0 1-1.37-1.7c-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.41-.56-.42h-.48c-.16 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.65 4.21 3.72.59.25 1.05.41 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.67-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.16-.48-.29Z" />
      </svg>
    ),
  },
] as const;

export function TelemetrySocialLinks() {
  const links = useSiteContent().global.social_links;

  return (
    <div className="engineering-note__socials" aria-label="Media sosial Instagram, TikTok, dan WhatsApp">
      {TELEMETRY_CHANNELS.map((channel) => {
        const href = findSocialHref(links, channel.labelPattern, channel.hostPattern);
        if (href) {
          return (
            <a
              key={channel.id}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={channel.name}
              title={channel.name}
              className={`engineering-note__social-btn engineering-note__social-btn--${channel.id}`}
            >
              {channel.icon}
            </a>
          );
        }

        return (
          <Link
            key={channel.id}
            href="/contact"
            aria-label={`${channel.name} (Hubungi saya)`}
            title={`${channel.name} — isi tautan di Admin → Konten → Tautan Sosial`}
            className={`engineering-note__social-btn engineering-note__social-btn--${channel.id}`}
          >
            {channel.icon}
          </Link>
        );
      })}
    </div>
  );
}

export default function SocialLinks() {
  const links = useSiteContent().global.social_links;
  return (
    <div className="quick-contact-pills" aria-label="Tautan sosial dan kontak">
      {links.map((link, index) => {
        const href = safePublicHref(link.href);
        if (!href || !link.label.trim()) return null;
        return <a key={`${index}-${href}`} href={href} className="quick-contact-pill"
          target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{link.label}</a>;
      })}
    </div>
  );
}
