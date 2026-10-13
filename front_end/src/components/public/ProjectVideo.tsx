"use client";

import { safePublicHref } from "@/lib/publicLinks";
import { useSiteContent } from "./SiteContentProvider";

export default function ProjectVideo({ url, title }: { url: string; title: string }) {
  const content = useSiteContent().project_detail;
  const href = safePublicHref(url);
  if (!href || !/^https?:\/\//i.test(href)) return null;
  const parsed = new URL(href);
  const host = parsed.hostname.toLowerCase();
  const youtubeHost = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host);
  const id = host === "youtu.be" ? parsed.pathname.slice(1)
    : youtubeHost ? parsed.searchParams.get("v") || parsed.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] : undefined;
  const youtubeId = id && /^[\w-]{11}$/.test(id) ? id : undefined;
  const isVideo = /\.(mp4|webm|ogg)$/i.test(parsed.pathname);
  return <section className="editorial-shell section-block" aria-labelledby="demo-video-title">
    <h2 id="demo-video-title" className="section-title">{content.video_title}</h2>
    {youtubeId ? <iframe className="project-demo-video" src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
      title={`Video demo ${title}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
      allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      : isVideo ? <video className="project-demo-video" controls preload="metadata" aria-label={`Video demo ${title}`} src={href} /> : null}
    <p><a className="button button--secondary" href={href} target="_blank" rel="noreferrer">{content.video_action_label}</a></p>
  </section>;
}
