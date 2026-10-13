"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Project } from "@/types";

import { FeedbackState, ProjectCard, ProjectSkeletons, TechTags } from "./EditorialUI";
import { useSiteContent } from "./SiteContentProvider";

export default function EditorialProjects({
  projects,
  projectsLoading,
  projectsError,
}: {
  projects: Project[];
  projectsLoading: boolean;
  projectsError: boolean;
}) {
  const content = useSiteContent().projects;
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const categories = useMemo(
    () => [content.all_category_label, ...Array.from(new Set(projects.map((project) => project.category?.trim()).filter(Boolean))) as string[]],
    [content.all_category_label, projects],
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchCategory = !activeCategory || activeCategory === content.all_category_label || project.category === activeCategory;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchCategory;

      const matchTitle = project.title?.toLowerCase().includes(query);
      const matchDescription = project.description?.toLowerCase().includes(query) || project.sub_title?.toLowerCase().includes(query);
      const matchTags = project.tech_tags?.some((tag) => tag.toLowerCase().includes(query));

      return matchCategory && (matchTitle || matchDescription || matchTags);
    });
  }, [projects, activeCategory, searchQuery, content.all_category_label]);

  return (
    <main>
      <section className="projects-hero" aria-labelledby="projects-page-title">
        <div className="editorial-shell projects-hero__layout">
          <div className="projects-hero__copy">
            <p className="eyebrow eyebrow--technical">{content.hero_eyebrow}</p>
            <h1 id="projects-page-title" className="display-title projects-hero__title">
              {content.hero_title}
            </h1>
            <p className="lede projects-hero__lede">
              {content.hero_description}
            </p>
          </div>
        </div>

        {!projectsLoading && !projectsError && projects.length > 0 && (
          <div className="editorial-shell projects-hero__filters">
            <div className="projects-hero__filters-left">
              <span className="eyebrow">{content.filter_label}</span>
              <div className="project-search-box">
                <svg className="project-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  className="project-search-input"
                  placeholder={content.search_placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Cari project"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="project-search-clear"
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus pencarian"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="filters" aria-label="Filter kategori project">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className="filter"
                  aria-pressed={activeCategory === category || (!activeCategory && category === content.all_category_label)}
                  onClick={() => setActiveCategory(category === content.all_category_label ? "" : category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="section-block project-index" aria-labelledby="projects-title">
        <div className="editorial-shell">
          <header className="project-index__header">
            <div>
              <p className="eyebrow eyebrow--technical">{content.index_eyebrow}</p>
              <h2 id="projects-title" className="section-title">{content.index_title}</h2>
            </div>

            {!projectsLoading && !projectsError && (
              <div className="projects-index__controls">
                <p className="project-index__count" style={{ margin: 0 }}>
                  {String(filteredProjects.length).padStart(2, "0")} {content.displayed_suffix}
                </p>

                <div className="view-mode-toggle" role="group" aria-label="Mode Tampilan Katalog">
                  <button
                    type="button"
                    className="view-mode-btn"
                    aria-pressed={viewMode === "grid"}
                    onClick={() => setViewMode("grid")}
                    title="Tampilan Grid Card"
                  >
                    <svg className="view-mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Grid
                  </button>
                  <button
                    type="button"
                    className="view-mode-btn"
                    aria-pressed={viewMode === "table"}
                    onClick={() => setViewMode("table")}
                    title="Tampilan Compact Spec Table"
                  >
                    <svg className="view-mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3" strokeLinecap="round" />
                      <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3" strokeLinecap="round" />
                      <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Table
                  </button>
                </div>
              </div>
            )}
          </header>

          {projectsLoading ? (
            <ProjectSkeletons count={3} variant="catalog" />
          ) : projectsError ? (
            <FeedbackState title="Proyek gagal dimuat" message="API proyek tidak merespons dengan benar. Muat ulang halaman untuk mencoba lagi." />
          ) : filteredProjects.length ? (
            viewMode === "grid" ? (
              <div className="project-grid project-grid--catalog">
                {filteredProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
            ) : (
              <div className="project-spec-table-wrap">
                <table className="project-spec-table">
                  <thead>
                    <tr>
                      <th>PROYEK & SISTEM</th>
                      <th>KATEGORI</th>
                      <th>TECH STACK</th>
                      <th>TAHUN</th>
                      <th style={{ textAlign: "right" }}>AKSI & REPOSITORI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => {
                      const year = project.created_at
                        ? new Date(project.created_at).getFullYear()
                        : new Date().getFullYear();
                      return (
                        <tr key={project.id}>
                          <td>
                            <Link href={`/projects/${project.id}`} className="table-project-title">
                              <strong>{project.title}</strong>
                              {project.sub_title && (
                                <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 400 }}>
                                  — {project.sub_title}
                                </span>
                              )}
                            </Link>
                          </td>
                          <td>
                            <span className="tag" style={{ fontSize: 11 }}>{project.category || "General"}</span>
                          </td>
                          <td>
                            <TechTags tags={project.tech_tags || []} maxVisible={3} technical />
                          </td>
                          <td>
                            <span style={{ fontFamily: "var(--font-mono-editorial)", fontSize: 12, color: "var(--muted)" }}>
                              {year}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                              {project.demo_url && (
                                <a
                                  href={project.demo_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="table-action-link"
                                  title="Buka Live Demo"
                                >
                                  Demo ↗
                                </a>
                              )}
                              {project.github_url && (
                                <a
                                  href={project.github_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="table-action-link"
                                  title="Buka Source Code GitHub"
                                >
                                  GitHub ↗
                                </a>
                              )}
                              <Link href={`/projects/${project.id}`} className="button button--secondary" style={{ padding: "4px 12px", fontSize: 11 }}>
                                Detail →
                              </Link>
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
            <FeedbackState
              title={projects.length ? "Tidak ada hasil" : "Belum ada project"}
              message={projects.length ? `Tidak ditemukan proyek yang cocok dengan kata kunci "${searchQuery}" pada kategori ${activeCategory || content.all_category_label}.` : "Project akan tampil di sini setelah datanya tersedia."}
            />
          )}
        </div>
      </section>
    </main>
  );
}
