"use client";

import { safePublicHref } from "@/lib/publicLinks";
import { useSiteContent } from "./SiteContentProvider";

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
