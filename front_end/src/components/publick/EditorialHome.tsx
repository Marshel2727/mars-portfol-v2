"use client";

import Link from "next/link";
import { useState } from "react";

import { getImageUrl } from "@/lib/utils";
import { AboutProfile, Project } from "@/types";

import { FeedbackState, ProjectCard, ProjectSkeletons } from "./EditorialUI";
import { useSiteContent } from "./SiteContentProvider";
import TelemetryWidget from "./TelemetryWidget";
import TextScramble from "@/components/ui/TextScramble";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

export default function EditorialHome({
  profile,
  projects,
  projectsLoading,
  projectsError,
}: {
  profile?: AboutProfile;
  projects: Project[];
  projectsLoading: boolean;
  projectsError: boolean;
}) {
  const siteContent = useSiteContent();
  const content = siteContent.home;
  const selectedProjects = projects.slice(0, Math.max(0, content.selected_project_count));
  const fullName = profile?.full_name?.trim() || "Marshel";
  const headline = profile?.headline?.trim() || "Computer Engineering Student";
  const profileImage = profile?.profile_image_url?.trim();

  const [selectedProjectTypeId, setSelectedProjectTypeId] = useState("");
  const selectedProjectType = content.project_types.find((type) => type.id === selectedProjectTypeId)
    || content.project_types[0]
    || { id: "general", label: "Project", description: "Ceritakan kebutuhan project Anda." };

  return (
    <main>
      <section className="editorial-shell hero" id="about">
        <div className="hero__copy">
          <TextScramble text={content.hero_eyebrow} className="eyebrow eyebrow--technical" />
          <h1 className="display-title">{content.hero_title}</h1>
          <p className="lede">
            {content.hero_description}
          </p>

          <div className="hero__actions">
            <Link className="button" href="/projects">{content.primary_action_label}</Link>
            <a className="button button--secondary" href="#profil">{content.secondary_action_label}</a>
          </div>

          <div className="hero__tech-strip">
            <span className="eyebrow eyebrow--technical" style={{ fontSize: 11 }}>{content.stack_label}</span>
            <div className="tech-marquee" aria-label="Teknologi utama">
              {content.tech_stack.map((tech) => (
                <span className="tag tag--technical" key={tech}>{tech}</span>
              ))}
            </div>
          </div>
        </div>

        <aside className="engineering-note" aria-label="Status & telemetri sistem">
          <TelemetryWidget />

          <div className="availability">
            <span className="status-pulse-dot" aria-hidden="true" />
            <span>{siteContent.global.availability_label}</span>
          </div>
        </aside>
      </section>

      {/* Quick Metrics Counter Section */}
      <section className="hero-metrics-bar">
        <div className="editorial-shell hero-metrics-grid">
          {content.metrics.map((metric, index) => (
            <div className="metric-card" key={`${metric.label}-${index}`}>
              <span className="metric-card__value">
                <AnimatedCounter
                  value={metric.value}
                  autoProjectCount={projects.length}
                />
              </span>
              <span className="metric-card__label">{metric.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="selected-work section-block section-block--subtle" aria-labelledby="selected-work-title">
        <div className="editorial-shell">
          <header className="section-header">
            <div className="section-header__copy">
              <p className="eyebrow">{content.selected_work_eyebrow}</p>
              <h2 id="selected-work-title" className="section-title">{content.selected_work_title}</h2>
            </div>
            <p className="section-header__aside">{content.selected_work_description}</p>
          </header>

          {projectsLoading ? (
            <ProjectSkeletons variant="featured" />
          ) : projectsError ? (
            <FeedbackState title="Project belum dapat dimuat" message="Terjadi kendala saat mengambil data project. Silakan coba lagi beberapa saat." />
          ) : selectedProjects.length ? (
            <div className="project-grid project-grid--featured">
              {selectedProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
            </div>
          ) : (
            <FeedbackState title="Belum ada project" message="Project terpilih akan tampil di bagian ini setelah datanya tersedia." />
          )}
        </div>
      </section>

      <section className="section-block about-section" id="profil" aria-labelledby="profile-title">
        <div className="editorial-shell">
          <header className="section-header" style={{ marginBottom: 36 }}>
            <div className="section-header__copy">
              <p className="eyebrow eyebrow--technical">{content.profile_eyebrow}</p>
              <h2 id="profile-title" className="section-title">{content.profile_title}</h2>
            </div>
            <p className="section-header__aside">
              Menggabungkan rekayasa perangkat lunak, sistem backend yang andal, dan integrasi perangkat keras IoT untuk menghasilkan solusi nyata.
            </p>
          </header>

          <div className="about-grid">
            {/* Left Column: Profile Identity Card & Narrative */}
            <div className="about-profile-card">
              <div className="about-profile-header">
                <div className="about-avatar-wrap">
                  {profileImage ? (
                    <img
                      className="about-avatar-img"
                      src={getImageUrl(profileImage)}
                      alt={`Foto profil ${fullName}`}
                    />
                  ) : (
                    <div className="about-avatar-fallback">
                      <span>{fullName.slice(0, 2).toUpperCase()}</span>
                    </div>
                  )}
                  <span className="about-avatar-status" title="Active Engineer" aria-hidden="true" />
                </div>
                <div className="about-profile-info">
                  <h3 className="about-profile-name">{fullName}</h3>
                  <p className="about-profile-headline">{headline}</p>
                  <TextScramble text={content.profile_discipline} className="about-profile-tag" />
                </div>
              </div>

              <div className="about-meta-badges">
                <span className="about-meta-pill">
                  <svg className="about-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" strokeWidth="2" />
                    <circle cx="12" cy="10" r="3" strokeWidth="2" />
                  </svg>
                  {profile?.location || "Indonesia"}
                </span>
                <span className="about-meta-pill">
                  <svg className="about-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeWidth="2" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" strokeWidth="2" />
                  </svg>
                  {profile?.education || "Teknik Komputer"}
                </span>
                <span className="about-meta-pill about-meta-pill--success">
                  ● Status: Available
                </span>
              </div>

              <div className="about-bio-text">
                <p>{profile?.bio || content.profile_fallback_bio}</p>
              </div>

              <div className="about-quote-box">
                <span className="about-quote-mark">“</span>
                <p className="about-quote-text">{content.principle_text}</p>
                <span className="about-quote-label">{content.principle_label}</span>
              </div>

              <div className="about-actions-row">
                <Link className="button" href="/skills">
                  Eksplorasi Skills & Specs →
                </Link>
                {profile?.cv_url && (
                  <a className="button button--secondary" href={profile.cv_url} target="_blank" rel="noreferrer">
                    {content.cv_action_label}
                  </a>
                )}
              </div>
            </div>

            {/* Right Column: Capabilities Stack */}
            <div className="about-capabilities-wrap">
              <div className="about-capabilities-heading">
                <p className="eyebrow eyebrow--technical">CORE CAPABILITIES</p>
                <h3>Pilar Keahlian Utama</h3>
              </div>
              <div className="about-capabilities-grid">
                {content.capabilities.map((capability, index) => (
                  <article className="about-capability-card" key={capability.title}>
                    <div className="about-capability-card__top">
                      <span className="about-capability-num">0{index + 1}</span>
                      <span className="tag tag--technical">{capability.tag}</span>
                    </div>
                    <h4>{capability.title}</h4>
                    <p>{capability.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block section-block--inverse" aria-labelledby="process-title">
        <div className="editorial-shell">
          <header className="section-header">
            <div className="section-header__copy">
              <p className="eyebrow">{content.process_eyebrow}</p>
              <h2 id="process-title" className="section-title">{content.process_title}</h2>
            </div>
            <p className="section-header__aside">{content.process_description}</p>
          </header>
          <div className="process-grid">
            {content.process_steps.map((step, index) => (
              <article className="process-step" key={`${step.title}-${index}`}>
                <div className="process-step__header">
                  <p className="eyebrow">{String(index + 1).padStart(2, "0")}</p>
                  <span className="process-step__line" aria-hidden="true" />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block" aria-labelledby="home-contact-title">
        <div className="editorial-shell home-contact">
          <div className="about-copy">
            <p className="eyebrow">{content.contact_eyebrow}</p>
            <h2 id="home-contact-title" className="section-title">{content.contact_title}</h2>
            <p className="lede">{content.contact_description}</p>
            <div className="availability">
              <span className="status-pulse-dot" aria-hidden="true" />
              <span>{siteContent.global.availability_label}</span>
            </div>
          </div>

          <div className="intake-preview">
            <p className="eyebrow" style={{ color: "var(--ink)" }}>{content.brief_builder_label}</p>
            <p className="intake-preview__sub">{content.brief_builder_description}</p>

            <div className="intake-preview__types" aria-label="Tipe project">
              {content.project_types.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`intake-type-btn${selectedProjectType.id === type.id ? " intake-type-btn--active" : ""}`}
                  onClick={() => setSelectedProjectTypeId(type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="intake-preview__summary">
              <div className="intake-preview__field">
                <span>{content.brief_focus_label}</span>
                <strong>{selectedProjectType.label}</strong>
              </div>
              <div className="intake-preview__field">
                <span>{content.brief_expectation_label}</span>
                <span>{selectedProjectType.description}</span>
              </div>
            </div>

            <Link
              className="button"
              href={`/contact?type=${encodeURIComponent(selectedProjectType.label)}&brief=${encodeURIComponent(selectedProjectType.description)}`}
              style={{ marginTop: 18 }}
            >
              {content.brief_action_prefix} {selectedProjectType.label} →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
