"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

import ResumeModal from "./ResumeModal";
import { SiteContentProvider, useSiteContent } from "./SiteContentProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getImageUrl } from "@/lib/utils";
import { getAboutProfile } from "@/services/about";
import { Project } from "@/types";

export function PublicNavbar() {
  const content = useSiteContent();
  const { data: profile } = useSWR("/about/", getAboutProfile);
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="site-header">
      <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} aria-hidden="true" />
      <div className="editorial-shell site-header__inner">
        <Link className="brand" href="/" aria-label={content.global.brand_aria_label}>
          {content.global.brand_name} <span className="brand--desktop">{content.global.brand_descriptor}</span>
        </Link>

        <div className="site-header__actions">
          <nav className="site-nav" aria-label="Navigasi utama">
            {content.global.nav_links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="navbar-resume-btn navbar-resume-btn--desktop"
            onClick={() => setIsResumeOpen(true)}
            aria-label="Lihat dan unduh CV Marshel"
          >
            {content.global.resume_button_label}
          </button>

          <ThemeToggle />

          <button
            type="button"
            className="mobile-toggle"
            aria-expanded={isOpen}
            aria-controls="mobile-public-navigation"
            onClick={() => setIsOpen((value) => !value)}
          >
            {isOpen ? content.global.mobile_menu_close_label : content.global.mobile_menu_open_label}
          </button>
        </div>
      </div>

      <ResumeModal
        isOpen={isResumeOpen}
        onClose={() => setIsResumeOpen(false)}
        cvUrl={profile?.cv_url}
        fullName={profile?.full_name}
      />

      <nav
        id="mobile-public-navigation"
        className="mobile-nav"
        data-open={isOpen}
        aria-label="Navigasi mobile"
      >
        {content.global.nav_links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(link.href) ? "page" : undefined}
            onClick={() => setIsOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <button
          type="button"
          className="navbar-resume-btn navbar-resume-btn--mobile"
          onClick={() => {
            setIsOpen(false);
            setIsResumeOpen(true);
          }}
        >
          {content.global.resume_button_label}
        </button>
      </nav>
    </header>
  );
}

export function PublicFooter() {
  const content = useSiteContent();
  return (
    <footer className="site-footer">
      <div className="editorial-shell site-footer__inner">
        <p className="brand">{content.global.brand_name} {content.global.brand_descriptor}</p>
        <p>{content.global.footer_text} / © {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}

export function TechTags({
  tags,
  technical = false,
  maxVisible,
}: {
  tags: string[];
  technical?: boolean;
  maxVisible?: number;
}) {
  if (!tags.length) return null;

  const visibleTags = typeof maxVisible === "number" ? tags.slice(0, maxVisible) : tags;
  const hiddenCount = Math.max(tags.length - visibleTags.length, 0);

  return (
    <div className="tag-row" aria-label="Teknologi">
      {visibleTags.map((tag) => (
        <span key={tag} className={`tag${technical ? " tag--technical" : ""}`}>
          {tag}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="tag tag--more" aria-label={`${hiddenCount} teknologi lainnya`}>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

function ProjectVisual({ project }: { project: Project }) {
  if (!project.image_url) {
    return (
      <div className="project-card__fallback" aria-hidden="true">
        <div className="interface-motif"><span /><span /><span /></div>
      </div>
    );
  }

  return (
    <img
      src={getImageUrl(project.image_url)}
      alt={`Tampilan proyek ${project.title}`}
      loading="lazy"
      decoding="async"
    />
  );
}

export function ProjectCard({ project }: { project: Project }) {
  const content = useSiteContent();
  const year = project.created_at
    ? new Date(project.created_at).getFullYear()
    : new Date().getFullYear();

  return (
    <article className="project-card">
      <Link className="project-card__visual" href={`/projects/${project.id}`} tabIndex={-1} aria-hidden="true">
        <ProjectVisual project={project} />
      </Link>
      <p className="eyebrow">{project.category || "PROJECT"}</p>
      <h3 className="card-title">
        <Link href={`/projects/${project.id}`}>{project.title}</Link>
      </h3>
      {project.sub_title && <p className="project-card__description">{project.sub_title}</p>}
      {!project.sub_title && <p className="project-card__description">{project.description}</p>}
      <TechTags tags={project.tech_tags || []} maxVisible={3} />
      <div className="project-card__footer">
        <span className="project-card__meta">{year} / {project.category || "PROJECT"}</span>
        <Link className="button button--secondary" href={`/projects/${project.id}`}>
          {content.projects.card_action_label}
        </Link>
      </div>
    </article>
  );
}

export function ProjectSkeletons({
  count = 2,
  variant = "featured",
}: {
  count?: number;
  variant?: "featured" | "catalog";
}) {
  return (
    <div className={`skeleton-grid skeleton-grid--${variant}`} aria-label="Memuat project" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}

export function FeedbackState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="feedback-state" role="status">
      <div className="feedback-state__inner">
        <h3>{title}</h3>
        <p>{message}</p>
        {action && <div style={{ marginTop: 20 }}>{action}</div>}
      </div>
    </div>
  );
}

export function EditorialPage({ children }: { children: React.ReactNode }) {
  return (
    <SiteContentProvider>
      <div className="editorial-page">
        <PublicNavbar />
        {children}
        <PublicFooter />
      </div>
    </SiteContentProvider>
  );
}

export { ProjectVisual };
