"use client";

import { useEffect, useRef } from "react";

import { useSiteContent } from "./SiteContentProvider";

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvUrl?: string;
  fullName?: string;
}

export default function ResumeModal({ isOpen, onClose, cvUrl, fullName }: ResumeModalProps) {
  const content = useSiteContent();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]') || []);
    (focusable()[0] || dialog)?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first) { e.preventDefault(); dialog?.focus(); return; }
        if (e.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
          e.preventDefault(); first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetCvUrl = cvUrl || content.resume.fallback_cv_url;
  const modalTitle = content.resume.title_template.replace("{name}", fullName || "Marshel");

  return (
    <div ref={dialogRef} tabIndex={-1} className="resume-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Curriculum Vitae Viewer">
      <div className="resume-modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="resume-modal-header">
          <div>
            <p className="eyebrow eyebrow--technical" style={{ fontSize: 12 }}>{content.resume.eyebrow}</p>
            <h3 className="resume-modal-title">{modalTitle}</h3>
          </div>
          <button type="button" className="resume-modal-close" onClick={onClose} aria-label="Tutup modal CV">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="resume-modal-body">
          <div className="resume-preview-card">
            <div className="resume-preview-header">
              <span className="resume-tag">{content.resume.tag}</span>
              <span className="resume-spec">{content.resume.version}</span>
            </div>
            <p className="resume-preview-desc">
              {content.resume.description}
            </p>
            <div className="resume-preview-highlights">
              {content.resume.highlights.map((highlight) => (
                <div key={`${highlight.label}-${highlight.value}`}>
                  <span>{highlight.label}</span><strong>{highlight.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="resume-modal-footer">
          <a
            className="button"
            href={targetCvUrl}
            target="_blank"
            rel="noreferrer"
            download={content.resume.download_filename}
          >
            {content.resume.download_label}
          </a>
          <button type="button" className="button button--secondary" onClick={onClose}>
            {content.resume.close_label}
          </button>
        </footer>
      </div>
    </div>
  );
}
