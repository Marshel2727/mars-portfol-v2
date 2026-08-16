"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";

import { getImageUrl } from "@/lib/utils";
import { getProjectById } from "@/services/project";

import { FeedbackState, ProjectVisual, TechTags } from "./EditorialUI";
import { useSiteContent } from "./SiteContentProvider";

function descriptionParagraphs(description: string) {
  return description
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default function EditorialProjectDetail({ projectId }: { projectId: number }) {
  const content = useSiteContent().project_detail;
  const isValidId = Number.isInteger(projectId) && projectId > 0;
  const { data: project, error, isLoading } = useSWR(
    isValidId ? `/projects/${projectId}` : null,
    () => getProjectById(projectId),
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const gallery = project?.gallery || [];
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrevious = useCallback(() => {
    setLightboxIndex((index) => index === null ? null : (index - 1 + gallery.length) % gallery.length);
  }, [gallery.length]);
  const showNext = useCallback(() => {
    setLightboxIndex((index) => index === null ? null : (index + 1) % gallery.length);
  }, [gallery.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft" && gallery.length > 1) showPrevious();
      if (event.key === "ArrowRight" && gallery.length > 1) showNext();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeLightbox, gallery.length, lightboxIndex, showNext, showPrevious]);

  if (!isValidId) {
    return <ProjectNotFound />;
  }

  if (isLoading) {
    return (
      <main className="editorial-shell section-block" aria-busy="true">
        <div className="skeleton" style={{ height: 620 }} />
      </main>
    );
  }

  if (error || !project) {
    const notFound = axios.isAxiosError(error) && error.response?.status === 404;
    return notFound ? <ProjectNotFound /> : (
      <main className="editorial-shell section-block">
        <FeedbackState
          title="Proyek gagal dimuat"
          message="Terjadi kendala saat mengambil detail proyek dari API."
          action={<Link className="button button--secondary" href="/projects">{content.back_label}</Link>}
        />
      </main>
    );
  }

  const paragraphs = descriptionParagraphs(project.description);
  const stack = Array.from(new Set([
    ...(project.tech_tags || []),
    ...(project.skills || []).map((skill) => skill.name),
  ])).filter(Boolean);

  const year = project.created_at
    ? new Date(project.created_at).getFullYear()
    : new Date().getFullYear();

  return (
    <>
      <main>
        <div className="editorial-shell breadcrumb-wrap">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <span className="breadcrumb__arrow">←</span>
            <Link href="/projects">{content.back_label}</Link>
            <span>/</span>
            <span className="breadcrumb__current" aria-current="page">{project.title}</span>
          </nav>
        </div>

        <section className="editorial-shell detail-hero">
          <div className="detail-hero__copy">
            <p className="eyebrow eyebrow--technical">
              {project.category?.toUpperCase() || "SYSTEM"} · REPOSITORY #{String(project.id).padStart(2, "0")} · {year}
            </p>
            <h1 className="display-title">{project.title}</h1>
            {project.sub_title && <p className="lede">{project.sub_title}</p>}
            <div className="hero__actions">
              {project.demo_url && (
                <a className="button" href={project.demo_url} target="_blank" rel="noreferrer">
                  {content.demo_label}
                </a>
              )}
              {project.github_url && (
                <a className="button button--secondary" href={project.github_url} target="_blank" rel="noreferrer">
                  {content.github_label}
                </a>
              )}
            </div>
          </div>
          <div className="detail-cover">
            <ProjectVisual project={project} />
          </div>
        </section>

        {/* Key Technical Highlights Box */}
        <div className="editorial-shell">
          <div className="tech-highlights-box" aria-label="Ringkasan Teknis Proyek">
            <div className="tech-highlights-header">
              <p className="eyebrow eyebrow--technical">KEY TECHNICAL HIGHLIGHTS</p>
              <span style={{ fontFamily: "var(--font-mono-editorial)", fontSize: 11, color: "var(--muted)" }}>
                VERIFIED ARCHITECTURE
              </span>
            </div>
            <div className="tech-highlights-grid">
              <div className="highlight-point">
                <span className="highlight-point__label">
                  <span>🎯</span> FOKUS & TUJUAN
                </span>
                <p className="highlight-point__text">
                  {project.sub_title || "Penyelesaian masalah sistem dengan arsitektur terstruktur dan antarmuka presisi."}
                </p>
              </div>
              <div className="highlight-point">
                <span className="highlight-point__label">
                  <span>⚡</span> CORE STACK
                </span>
                <p className="highlight-point__text">
                  {stack.slice(0, 4).join(", ") || "Next.js, TypeScript, REST API"}
                </p>
              </div>
              <div className="highlight-point">
                <span className="highlight-point__label">
                  <span>🛡️</span> DEPLOYMENT & DELIVERY
                </span>
                <p className="highlight-point__text">
                  {project.demo_url ? "Production Ready & Live Deployed" : "Modular Codebase & Tested Architecture"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="section-block section-block--subtle" aria-labelledby="about-project-title">
          <div className="editorial-shell detail-content-grid">
            <article className="detail-copy">
              <p className="eyebrow eyebrow--technical">{content.about_eyebrow}</p>
              <h2 id="about-project-title" className="section-title">
                {project.sub_title || content.about_fallback_title}
              </h2>
              {paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>
              ))}
            </article>

            <aside className="metadata-card">
              <p className="eyebrow eyebrow--technical">{content.stack_eyebrow}</p>
              <TechTags tags={stack} technical />
              <dl className="metadata-row">
                <dt>{content.category_label}</dt>
                <dd>{project.category || "General"}</dd>
              </dl>
              {project.skills && project.skills.length > 0 && (
                <dl className="metadata-row">
                  <dt>{content.skills_label}</dt>
                  <dd>{project.skills.map((skill) => skill.name).join(", ")}</dd>
                </dl>
              )}
            </aside>
          </div>
        </section>

        {project.architecture_steps && project.architecture_steps.length > 0 && (
          <section className="section-block" aria-labelledby="architecture-title">
            <div className="editorial-shell">
              <header className="section-header" style={{ marginBottom: 24 }}>
                <div>
                  <p className="eyebrow eyebrow--technical">{content.architecture_eyebrow}</p>
                  <h2 id="architecture-title" className="section-title">{content.architecture_title}</h2>
                </div>
              </header>

              <div className="arch-flow-grid">
                {project.architecture_steps.map((step, index) => (
                  <div key={`${step.label}-${step.title}-${index}`} style={{ display: "contents" }}>
                    {index > 0 && <div className="arch-arrow">➔</div>}
                    <div className="arch-node">
                      <span className="arch-node__step">{step.label || String(index + 1).padStart(2, "0")}</span>
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="section-block" aria-labelledby="gallery-title">
          <div className="editorial-shell">
            <header className="gallery-heading">
              <p className="eyebrow eyebrow--technical">{content.gallery_eyebrow}</p>
              <h2 id="gallery-title" className="section-title">{content.gallery_title}</h2>
            </header>
            {gallery.length ? (
              <div className="gallery-grid">
                {gallery.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    className="gallery-item"
                    onClick={() => setLightboxIndex(index)}
                    aria-label={`Buka gambar ${index + 1}: ${image.caption || project.title}`}
                  >
                    <img src={getImageUrl(image.image_url)} alt={image.caption || `${project.title}, gambar ${index + 1}`} />
                    <span>{image.caption || `Dokumentasi ${index + 1}`}</span>
                  </button>
                ))}
              </div>
            ) : (
              <FeedbackState title={content.gallery_empty_title} message={content.gallery_empty_message} />
            )}
          </div>
        </section>
      </main>

      {lightboxIndex !== null && gallery[lightboxIndex] && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Galeri ${project.title}`} onClick={closeLightbox}>
          <div className="lightbox__top" onClick={(e) => e.stopPropagation()}>
            <span className="brand">{project.title}</span>
            <button className="lightbox__close" type="button" onClick={closeLightbox} aria-label="Tutup lightbox">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="lightbox__media" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl(gallery[lightboxIndex].image_url)}
              alt={gallery[lightboxIndex].caption || `${project.title}, gambar ${lightboxIndex + 1}`}
            />
          </div>
          <div className="lightbox__bottom" onClick={(e) => e.stopPropagation()}>
            <p className="lightbox__caption">
              {gallery[lightboxIndex].caption || "Dokumentasi proyek"} · {lightboxIndex + 1}/{gallery.length}
            </p>
            {gallery.length > 1 && (
              <div className="lightbox__controls">
                <button className="lightbox__control" type="button" onClick={showPrevious} aria-label="Gambar sebelumnya">←</button>
                <button className="lightbox__control" type="button" onClick={showNext} aria-label="Gambar berikutnya">→</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ProjectNotFound() {
  const content = useSiteContent().project_detail;
  return (
    <main className="editorial-shell section-block">
      <FeedbackState
        title="Proyek tidak ditemukan"
        message="ID proyek tidak valid atau proyek sudah tidak tersedia pada repositori."
        action={<Link className="button button--secondary" href="/projects">{content.back_label}</Link>}
      />
    </main>
  );
}
