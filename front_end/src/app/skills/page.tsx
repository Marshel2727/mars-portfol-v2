"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { EditorialPage, FeedbackState } from "@/components/publick/EditorialUI";
import { useSiteContent } from "@/components/publick/SiteContentProvider";
import { getImageUrl } from "@/lib/utils";
import { getAllSkill } from "@/services/Skils";
import { Skill } from "@/types";

function getCompetencyBadge(level: string) {
  const normalized = level?.toLowerCase() || "";
  if (normalized === "expert") {
    return {
      label: "Core Stack",
      className: "competency-level-badge--core",
    };
  }
  if (normalized === "advanced") {
    return {
      label: "Advanced",
      className: "competency-level-badge--advanced",
    };
  }
  if (normalized === "intermediate") {
    return {
      label: "Proficient",
      className: "competency-level-badge--advanced",
    };
  }
  return {
    label: "Working Knowledge",
    className: "competency-level-badge--proficient",
  };
}

function getSkillDescription(skill: Skill): string {
  if (skill.detail?.trim()) return skill.detail.trim();
  const cat = (skill.category || "").toLowerCase();
  if (cat.includes("front") || cat.includes("web") || cat.includes("ui")) {
    return `${skill.name} diterapkan secara aktif dalam perancangan antarmuka modern yang responsif, modular, dan memprioritaskan kenyamanan serta kejelasan interaksi pengguna.`;
  }
  if (cat.includes("back") || cat.includes("api") || cat.includes("server")) {
    return `${skill.name} diimplementasikan untuk membangun arsitektur RESTful API yang scalable, manajemen autentikasi aman, dan pengolahan logika data berkinerja tinggi.`;
  }
  if (cat.includes("iot") || cat.includes("embed") || cat.includes("hard")) {
    return `${skill.name} digunakan dalam ekosistem Internet of Things untuk integrasi sensor fisik, telemetri data real-time, dan komunikasi nirkabel mikrokontroler.`;
  }
  if (cat.includes("data") || cat.includes("sql")) {
    return `${skill.name} digunakan untuk manajemen skema relasional, optimasi kueri terstruktur, dan pemeliharaan integritas basis data produksi.`;
  }
  return `${skill.name} digunakan secara aktif dalam pipeline arsitektur rekayasa sistem untuk menjamin performa tinggi, kebersihan kode, dan skalabilitas.`;
}

function SkillDetailModal({
  skill,
  onClose,
}: {
  skill: Skill;
  onClose: () => void;
}) {
  const badge = getCompetencyBadge(skill.level);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skill-modal-title"
      onClick={onClose}
    >
      <div className="skill-modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="skill-modal-header">
          <div className="skill-modal-title-wrap">
            {skill.icon_url && (
              <div className="skill-modal-icon">
                <img src={getImageUrl(skill.icon_url)} alt="" aria-hidden="true" />
              </div>
            )}
            <div>
              <h3 id="skill-modal-title" className="skill-modal-title">
                {skill.name}
              </h3>
              <div className="skill-modal-meta-row">
                <span className="tag" style={{ fontSize: 12 }}>{skill.category}</span>
                <span className={`competency-level-badge ${badge.className}`}>{badge.label}</span>
                {skill.years_experience && (
                  <span style={{ fontFamily: "var(--font-mono-editorial)", fontSize: 12, color: "var(--muted)" }}>
                    • {skill.years_experience}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="skill-modal-close"
            onClick={onClose}
            aria-label="Tutup lembar spesifikasi"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="skill-modal-body">
          {/* Section: Kapabilitas & Ekosistem */}
          <div className="skill-modal-section">
            <h4 className="skill-modal-section-title">⚡ KAPABILITAS REKAYASA & EKOSISTEM</h4>
            <p className="skill-modal-text">
              {getSkillDescription(skill)}
            </p>
          </div>

          {/* Section: Status Implementasi */}
          <div className="skill-modal-section">
            <h4 className="skill-modal-section-title">🛡️ STATUS IMPLEMENTASI & STANDAR</h4>
            <p className="skill-modal-text" style={{ fontSize: 14, color: "var(--muted)" }}>
              {badge.label === "Core Stack"
                ? "Teknologi pilar utama yang digunakan dalam pengembangan sistem produksi, arsitektur data, dan pengujian edge-case."
                : badge.label === "Advanced"
                ? "Penguasaan mendalam terhadap implementasi modul, optimasi logika, dan integrasi antarmuka."
                : "Penguasaan fungsional yang stabil untuk pemeliharaan dan integrasi layanan."}
            </p>
          </div>

          {/* Section: Proyek Terkait */}
          <div className="skill-modal-section">
            <h4 className="skill-modal-section-title">
              📁 PROYEK TERVERIFIKASI ({skill.projects?.length || 0})
            </h4>
            {skill.projects && skill.projects.length > 0 ? (
              <div className="skill-modal-projects-grid">
                {skill.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="skill-modal-project-card"
                    onClick={onClose}
                  >
                    <span className="skill-modal-project-cat">{project.category || "PROYEK"}</span>
                    <h5 className="skill-modal-project-title">{project.title}</h5>
                    <span style={{ fontSize: 12, color: "var(--accent-strong)", fontWeight: 600 }}>
                      Lihat Studi Kasus →
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="skill-modal-text" style={{ fontSize: 13, color: "var(--muted)" }}>
                Teknologi ini merupakan bagian dari stack inti sistem dan diimplementasikan pada proyek terpadu.
              </p>
            )}
          </div>
        </div>

        <footer className="skill-modal-footer">
          <Link
            className="button"
            href={`/contact?type=${encodeURIComponent(skill.name)}&brief=${encodeURIComponent(`Tertarik mendiskusikan implementasi proyek dengan ${skill.name}`)}`}
            onClick={onClose}
          >
            Diskusikan Proyek dengan {skill.name} →
          </Link>
          <button type="button" className="button button--secondary" onClick={onClose}>
            Tutup
          </button>
        </footer>
      </div>
    </div>
  );
}

function SkillsContent({ skills, loading, error }: { skills: Skill[]; loading: boolean; error: boolean }) {
  const content = useSiteContent().skills;
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const groupedSkills = useMemo(() => skills.reduce<Record<string, Skill[]>>((groups, skill) => {
    const category = skill.category?.trim() || "Lainnya";
    groups[category] = [...(groups[category] || []), skill];
    return groups;
  }, {}), [skills]);

  const headers = content.table_headers;
  const handleCloseModal = useCallback(() => setSelectedSkill(null), []);

  return (
    <main className="skills-page-wrapper">
      <section className="editorial-shell skills-hero">
        <p className="eyebrow eyebrow--technical">{content.hero_eyebrow}</p>
        <h1 className="display-title skills-hero__title">{content.hero_title}</h1>
        <p className="lede skills-hero__lede">{content.hero_description}</p>
      </section>

      <section className="section-block section-block--subtle" aria-labelledby="core-competencies-title">
        <div className="editorial-shell">
          <header className="section-header" style={{ marginBottom: 28, flexWrap: "wrap", gap: 20 }}>
            <div>
              <p className="eyebrow eyebrow--technical">
                {viewMode === "grid" ? content.competencies_eyebrow : content.specifications_eyebrow}
              </p>
              <h2 id="core-competencies-title" className="section-title">
                {viewMode === "grid" ? content.competencies_title : content.specifications_title}
              </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                💡 Klik item untuk rincian spesifikasi & studi kasus
              </p>

              <div className="view-mode-toggle" role="group" aria-label="Mode Tampilan Keahlian">
                <button
                  type="button"
                  className="view-mode-btn"
                  aria-pressed={viewMode === "grid"}
                  onClick={() => setViewMode("grid")}
                  title="Tampilan Grid Disiplin"
                >
                  <svg className="view-mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </svg>
                  Grid Disiplin
                </button>
                <button
                  type="button"
                  className="view-mode-btn"
                  aria-pressed={viewMode === "table"}
                  onClick={() => setViewMode("table")}
                  title="Tampilan Matriks Spesifikasi"
                >
                  <svg className="view-mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3" strokeLinecap="round" />
                    <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3" strokeLinecap="round" />
                    <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Matriks Spek
                </button>
              </div>
            </div>
          </header>

          {loading ? (
            <div className="skeleton" style={{ height: 280 }} aria-label="Memuat skill" />
          ) : error ? (
            <FeedbackState title="Skill gagal dimuat" message="API skill tidak merespons dengan benar." />
          ) : skills.length > 0 ? (
            viewMode === "grid" ? (
              <div className="core-competencies-grid">
                {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                  <article key={category} className="competency-card">
                    <div className="competency-card__header">
                      <svg className="competency-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.8" />
                        <path d="m8 9 3 3-3 3m5 0h3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="competency-card__title">{category}</span>
                    </div>
                    <ul className="competency-card__list">
                      {categorySkills.map((skill) => {
                        const badge = getCompetencyBadge(skill.level);
                        return (
                          <li
                            key={skill.id}
                            className="competency-card__item competency-card__item--clickable"
                            onClick={() => setSelectedSkill(skill)}
                            title={`Klik untuk melihat spesifikasi teknis ${skill.name}`}
                          >
                            <span className="competency-card__name">
                              {skill.icon_url && (
                                <img
                                  src={getImageUrl(skill.icon_url)}
                                  alt=""
                                  aria-hidden="true"
                                  style={{ width: 20, height: 20, objectFit: "contain", marginRight: 8, verticalAlign: "middle" }}
                                />
                              )}
                              {skill.name}
                            </span>
                            <span className={`competency-level-badge ${badge.className}`} style={{ fontSize: 11, padding: "2px 8px" }}>
                              {badge.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <div className="tech-spec-table-wrap">
                <table className="tech-spec-table">
                  <thead>
                    <tr>
                      <th>{headers[0] || "TEKNOLOGI"}</th>
                      <th>{headers[1] || "KATEGORI"}</th>
                      <th>{headers[2] || "LEVEL PENGALAMAN"}</th>
                      <th>{headers[3] || "STATUS & EKOSISTEM"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.map((skill) => {
                      const badge = getCompetencyBadge(skill.level);
                      return (
                        <tr
                          key={skill.id}
                          className="skill-row--clickable"
                          onClick={() => setSelectedSkill(skill)}
                          title={`Klik untuk melihat detail ${skill.name}`}
                        >
                          <td className="tech-spec__name">
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                              {skill.icon_url && (
                                <img
                                  src={getImageUrl(skill.icon_url)}
                                  alt=""
                                  aria-hidden="true"
                                  style={{ width: 22, height: 22, objectFit: "contain" }}
                                />
                              )}
                              <span>{skill.name} ↗</span>
                            </div>
                          </td>
                          <td className="tech-spec__category">
                            <span className="tag" style={{ fontSize: 12 }}>{skill.category}</span>
                          </td>
                          <td className="tech-spec__level">
                            <span className={`competency-level-badge ${badge.className}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="tech-spec__eco">
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {skill.detail && (
                                <span className="competency-ecosystem-text">{skill.detail}</span>
                              )}
                              {skill.projects && skill.projects.length > 0 ? (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {skill.projects.map((proj) => (
                                    <Link
                                      key={proj.id}
                                      href={`/projects/${proj.id}`}
                                      className="competency-project-pill"
                                      onClick={(e) => e.stopPropagation()}
                                      title={`Lihat studi kasus: ${proj.title}`}
                                    >
                                      ↗ {proj.title}
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                !skill.detail && (
                                  <span className="competency-ecosystem-text" style={{ color: "var(--muted)", fontSize: 13 }}>
                                    Aktif diimplementasikan pada pipeline rekayasa
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <FeedbackState title="Belum ada skill" message="Tambahkan skill dari halaman admin agar muncul di sini." />
          )}
        </div>
      </section>

      <section className="section-block section-block--subtle" aria-labelledby="milestones-title">
        <div className="editorial-shell">
          <header className="section-header" style={{ marginBottom: 32 }}>
            <div>
              <p className="eyebrow eyebrow--technical">{content.timeline_eyebrow}</p>
              <h2 id="milestones-title" className="section-title">{content.timeline_title}</h2>
            </div>
          </header>

          <div className="milestones-timeline">
            {content.milestones.map((item, index) => (
              <article key={`${item.period}-${index}`} className="milestone-item">
                <div className="milestone-item__left">
                  <span className="milestone-dot" />
                  <span className="milestone-period">{item.period}</span>
                </div>
                <div className="milestone-item__content">
                  <h3 className="milestone-role">{item.role}</h3>
                  <p className="milestone-desc">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block" aria-labelledby="skills-cta-title">
        <div className="editorial-shell skills-cta">
          <div className="skills-cta__copy">
            <p className="eyebrow eyebrow--technical">{content.cta_eyebrow}</p>
            <h2 id="skills-cta-title" className="section-title">{content.cta_title}</h2>
            <p className="lede">{content.cta_description}</p>
          </div>
          <div className="skills-cta__actions">
            <Link className="button" href="/projects">{content.projects_action_label}</Link>
            <Link className="button button--secondary" href="/contact">{content.contact_action_label}</Link>
          </div>
        </div>
      </section>

      {/* Interactive Skill Inspector Modal */}
      {selectedSkill && (
        <SkillDetailModal skill={selectedSkill} onClose={handleCloseModal} />
      )}
    </main>
  );
}

export default function SkillsPage() {
  const { data, isLoading, error } = useSWR("/skills/", getAllSkill);
  return (
    <EditorialPage>
      <SkillsContent
        skills={Array.isArray(data) ? data : []}
        loading={isLoading}
        error={Boolean(error)}
      />
    </EditorialPage>
  );
}
