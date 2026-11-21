"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { safePublicHref } from "@/lib/publicLinks";
import { getImageUrl } from "@/lib/utils";
import { Certificate } from "@/types";

import { FeedbackState, ProjectSkeletons } from "./EditorialUI";
import { useSiteContent } from "./SiteContentProvider";

function CertificatePreviewModal({
  cert,
  verifyLabel,
  onClose,
}: {
  cert: Certificate;
  verifyLabel: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), iframe, [tabindex="0"]',
        ) || [],
      );
    (focusable()[0] || dialog)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first) {
          e.preventDefault();
          dialog?.focus();
          return;
        }
        if (e.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const rawFileUrl = getImageUrl(cert.file_url);
  const fileUrl = rawFileUrl ? safePublicHref(rawFileUrl) : undefined;
  const verifyHref = cert.credential_url ? safePublicHref(cert.credential_url) : undefined;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="resume-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="certificate-modal-title"
    >
      <div
        className="resume-modal-container"
        style={{ maxWidth: 860, maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="resume-modal-header">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <p className="eyebrow eyebrow--technical" style={{ fontSize: 12 }}>
                {cert.category || "SERTIFIKAT"}
              </p>
              {cert.is_featured && (
                <span
                  className="competency-level-badge competency-level-badge--core"
                  style={{ fontSize: 10, padding: "2px 8px" }}
                >
                  ★ FEATURED
                </span>
              )}
            </div>
            <h3 id="certificate-modal-title" className="resume-modal-title">
              {cert.title}
            </h3>
          </div>
          <button
            type="button"
            className="resume-modal-close"
            onClick={onClose}
            aria-label="Tutup modal pratinjau sertifikat"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div
          className="resume-modal-body"
          style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}
        >
          {fileUrl && cert.file_type === "image" && (
            <div
              style={{
                border: "1px solid var(--line)",
                borderRadius: 8,
                overflow: "hidden",
                background: "var(--paper)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={fileUrl}
                alt={`Pratinjau sertifikat ${cert.title}`}
                style={{
                  width: "100%",
                  maxHeight: "52vh",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          )}

          {fileUrl && cert.file_type === "pdf" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <iframe
                src={fileUrl}
                title={`Dokumen PDF ${cert.title}`}
                style={{
                  width: "100%",
                  height: "50vh",
                  minHeight: 320,
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  background: "var(--paper)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span className="project-card__meta">PDF DOCUMENT // VERIFIED</span>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="table-action-link"
                >
                  Unduh / Buka PDF ↗
                </a>
              </div>
            </div>
          )}

          <div className="resume-preview-card">
            <div className="resume-preview-header">
              <span className="resume-tag">{cert.category || "SERTIFIKAT"}</span>
              <span className="resume-spec">
                {cert.file_type === "pdf" ? "PDF DOCUMENT" : "IMAGE CERTIFICATE"}
              </span>
            </div>
            {cert.description && (
              <p className="resume-preview-desc">{cert.description}</p>
            )}
            <div className="resume-preview-highlights">
              <div>
                <span>PENERBIT</span>
                <strong>{cert.issuer}</strong>
              </div>
              {cert.issue_date && (
                <div>
                  <span>TANGGAL TERBIT</span>
                  <strong>{cert.issue_date}</strong>
                </div>
              )}
              {cert.credential_id && (
                <div>
                  <span>ID KREDENSIAL</span>
                  <strong style={{ fontFamily: "var(--font-mono-editorial)", wordBreak: "break-all" }}>
                    {cert.credential_id}
                  </strong>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="resume-modal-footer" style={{ flexWrap: "wrap" }}>
          {fileUrl && (
            <a
              className="button"
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              {cert.file_type === "pdf" ? "Unduh / Buka PDF ↗" : "Buka / Unduh Dokumen ↗"}
            </a>
          )}
          {verifyHref && (
            <a
              className="button button--secondary"
              href={verifyHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              {verifyLabel}
            </a>
          )}
          <button type="button" className="button button--secondary" onClick={onClose}>
            Tutup
          </button>
        </footer>
      </div>
    </div>
  );
}

function CertificateVisual({ cert }: { cert: Certificate }) {
  const rawFileUrl = getImageUrl(cert.file_url);
  const fileUrl = rawFileUrl ? safePublicHref(rawFileUrl) : undefined;

  if (cert.file_type === "pdf") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "16px 18px",
          background: "var(--paper-deep)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
          borderRadius: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--font-mono-editorial)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--technical)",
            }}
          >
            PDF DOCUMENT // VERIFIED
          </span>
          <span
            className="tag"
            style={{
              fontSize: 10,
              minHeight: 22,
              padding: "2px 8px",
              borderColor: "var(--accent)",
              color: "var(--accent-strong)",
            }}
          >
            PDF
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "left" }}>
          <strong
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 500,
              lineHeight: 1.2,
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cert.issuer}
          </strong>
          {cert.credential_id && (
            <span
              style={{
                fontFamily: "var(--font-mono-editorial)",
                fontSize: 11,
                color: "var(--muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              ID: {cert.credential_id}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="project-card__fallback" aria-hidden="true">
        <div className="interface-motif"><span /><span /><span /></div>
      </div>
    );
  }

  return (
    <img
      src={fileUrl}
      alt={`Sertifikat ${cert.title} dari ${cert.issuer}`}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function EditorialCertificates({
  certificates,
  certificatesLoading,
  certificatesError,
}: {
  certificates: Certificate[];
  certificatesLoading: boolean;
  certificatesError: boolean;
}) {
  const content = useSiteContent().certificates;
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const handleCloseModal = useCallback(() => setSelectedCert(null), []);

  const categories = useMemo(
    () => [
      content.all_category_label,
      ...Array.from(
        new Set(
          certificates
            .map((cert) => cert.category?.trim())
            .filter((cat): cat is string => Boolean(cat) && cat !== content.all_category_label),
        ),
      ),
    ],
    [content.all_category_label, certificates],
  );

  const filteredCertificates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return certificates.filter((cert) => {
      const certCategory = cert.category?.trim() || "";
      const matchCategory =
        !activeCategory ||
        activeCategory === content.all_category_label ||
        certCategory === activeCategory;
      if (!query) return matchCategory;

      const matchQuery = [
        cert.title,
        cert.issuer,
        cert.category,
        cert.credential_id,
        cert.description,
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query));

      return matchCategory && matchQuery;
    });
  }, [certificates, activeCategory, searchQuery, content.all_category_label]);

  return (
    <main>
      <section className="projects-hero" aria-labelledby="certificates-page-title">
        <div className="editorial-shell projects-hero__layout">
          <div className="projects-hero__copy">
            <p className="eyebrow eyebrow--technical">{content.hero_eyebrow}</p>
            <h1 id="certificates-page-title" className="display-title projects-hero__title">
              {content.hero_title}
            </h1>
            <p className="lede projects-hero__lede">
              {content.hero_description}
            </p>
          </div>
        </div>

        {!certificatesLoading && !certificatesError && certificates.length > 0 && (
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
                  aria-label="Cari sertifikat"
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

            <div className="filters" aria-label="Filter kategori sertifikat">
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

      <section className="section-block project-index" aria-labelledby="certificates-title">
        <div className="editorial-shell">
          <header className="project-index__header">
            <div>
              <p className="eyebrow eyebrow--technical">{content.index_eyebrow}</p>
              <h2 id="certificates-title" className="section-title">{content.index_title}</h2>
            </div>

            {!certificatesLoading && !certificatesError && (
              <div className="projects-index__controls">
                <p className="project-index__count" style={{ margin: 0 }}>
                  {String(filteredCertificates.length).padStart(2, "0")} {content.displayed_suffix}
                </p>

                <div className="view-mode-toggle" role="group" aria-label="Mode Tampilan Katalog">
                  <button
                    type="button"
                    className="view-mode-btn"
                    aria-pressed={viewMode === "grid"}
                    onClick={() => setViewMode("grid")}
                    title="Tampilan Grid Card"
                  >
                    <svg className="view-mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
                    <svg className="view-mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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

          {certificatesLoading ? (
            <ProjectSkeletons count={3} variant="catalog" />
          ) : certificatesError ? (
            <FeedbackState
              title="Sertifikat gagal dimuat"
              message="API sertifikat tidak merespons dengan benar. Muat ulang halaman untuk mencoba lagi."
            />
          ) : filteredCertificates.length ? (
            viewMode === "grid" ? (
              <div className="project-grid project-grid--catalog">
                {filteredCertificates.map((cert) => {
                  const verifyHref = cert.credential_url ? safePublicHref(cert.credential_url) : undefined;
                  return (
                    <article key={cert.id} className="project-card">
                      <button
                        type="button"
                        className="project-card__visual"
                        onClick={() => setSelectedCert(cert)}
                        aria-label={`${content.preview_action_label}: ${cert.title}`}
                        style={{
                          border: "none",
                          padding: 0,
                          width: "100%",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "block",
                        }}
                      >
                        <CertificateVisual cert={cert} />
                      </button>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                        <p className="eyebrow">{cert.category || "SERTIFIKAT"}</p>
                        {cert.is_featured && (
                          <span
                            className="competency-level-badge competency-level-badge--core"
                            style={{ fontSize: 10, padding: "2px 8px" }}
                          >
                            ★ FEATURED
                          </span>
                        )}
                      </div>

                      <h3 className="card-title">
                        <button
                          type="button"
                          onClick={() => setSelectedCert(cert)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            margin: 0,
                            font: "inherit",
                            color: "inherit",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          {cert.title}
                        </button>
                      </h3>

                      <p className="project-card__meta" style={{ margin: 0, textTransform: "none" }}>
                        {cert.issuer}
                        {cert.issue_date ? ` • ${cert.issue_date}` : ""}
                      </p>

                      {cert.description && (
                        <p className="project-card__description">{cert.description}</p>
                      )}

                      <div
                        className="project-card__footer"
                        style={{ flexWrap: "wrap", gap: 10 }}
                      >
                        {cert.credential_id && (
                          <span
                            className="project-card__meta"
                            style={{ flexBasis: "100%", overflowWrap: "anywhere", textTransform: "none" }}
                          >
                            ID: {cert.credential_id}
                          </span>
                        )}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            width: "100%",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() => setSelectedCert(cert)}
                          >
                            {content.preview_action_label}
                          </button>
                          {verifyHref && (
                            <a
                              href={verifyHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="table-action-link"
                            >
                              {content.verify_action_label}
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="project-spec-table-wrap">
                <table className="project-spec-table">
                  <thead>
                    <tr>
                      <th>SERTIFIKAT &amp; DESKRIPSI</th>
                      <th>PENERBIT</th>
                      <th>KATEGORI</th>
                      <th>TANGGAL / ID</th>
                      <th style={{ textAlign: "right" }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCertificates.map((cert) => {
                      const verifyHref = cert.credential_url ? safePublicHref(cert.credential_url) : undefined;
                      return (
                        <tr key={cert.id}>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  className="table-project-title"
                                  onClick={() => setSelectedCert(cert)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                    textAlign: "left",
                                  }}
                                >
                                  <strong>{cert.title}</strong>
                                </button>
                                {cert.is_featured && (
                                  <span
                                    className="competency-level-badge competency-level-badge--core"
                                    style={{ fontSize: 10, padding: "1px 6px" }}
                                  >
                                    ★ FEATURED
                                  </span>
                                )}
                                <span
                                  className="tag tag--technical"
                                  style={{ fontSize: 10, minHeight: 20, padding: "1px 6px" }}
                                >
                                  {cert.file_type.toUpperCase()}
                                </span>
                              </div>
                              {cert.description && (
                                <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 400 }}>
                                  {cert.description}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: "var(--ink)" }}>{cert.issuer}</span>
                          </td>
                          <td>
                            <span className="tag" style={{ fontSize: 11 }}>{cert.category || "Lainnya"}</span>
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                fontFamily: "var(--font-mono-editorial)",
                                fontSize: 12,
                                color: "var(--muted)",
                              }}
                            >
                              <span>{cert.issue_date || "—"}</span>
                              {cert.credential_id && (
                                <span style={{ fontSize: 11, wordBreak: "break-all" }}>
                                  ID: {cert.credential_id}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                              {verifyHref && (
                                <a
                                  href={verifyHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="table-action-link"
                                  title={content.verify_action_label}
                                >
                                  {content.verify_action_label}
                                </a>
                              )}
                              <button
                                type="button"
                                className="button button--secondary"
                                style={{ padding: "4px 12px", fontSize: 11 }}
                                onClick={() => setSelectedCert(cert)}
                              >
                                {content.preview_action_label}
                              </button>
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
              title={certificates.length ? "Tidak ada hasil" : "Belum ada sertifikat"}
              message={
                certificates.length
                  ? `Tidak ditemukan sertifikat yang cocok dengan kata kunci "${searchQuery}" pada kategori ${activeCategory || content.all_category_label}.`
                  : "Sertifikat akan tampil di sini setelah datanya tersedia."
              }
            />
          )}
        </div>
      </section>

      {selectedCert && (
        <CertificatePreviewModal
          cert={selectedCert}
          verifyLabel={content.verify_action_label}
          onClose={handleCloseModal}
        />
      )}
    </main>
  );
}
