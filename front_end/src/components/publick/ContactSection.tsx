"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import Toast from "@/components/ui/Toast";
import { createMessage } from "@/services/messages";
import { getApiErrorMessage } from "@/services/api";

import { useSiteContent } from "./SiteContentProvider";

type FormValues = { name: string; email: string; content: string };
type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = { name: "", email: "", content: "" };

function validate(values: FormValues, messages: ReturnType<typeof useSiteContent>["contact"]): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = messages.name_required_message;
  if (!values.email.trim()) errors.email = messages.email_required_message;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = messages.email_invalid_message;
  if (!values.content.trim()) errors.content = messages.message_required_message;
  return errors;
}

export default function ContactSection() {
  const siteContent = useSiteContent();
  const content = siteContent.contact;
  const projectTypes = siteContent.home.project_types || [];
  const searchParams = useSearchParams();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [selectedBriefType, setSelectedBriefType] = useState<string | null>(null);
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: "success" | "error" }>({
    isVisible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam) {
      setSelectedBriefType(typeParam);
    }
  }, [searchParams]);

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (status !== "idle") setStatus("idle");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;
    const nextErrors = validate(values, content);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSending(true);
    setStatus("idle");
    try {
      const finalContent = selectedBriefType
        ? `[Fokus: ${selectedBriefType}]\n\n${values.content.trim()}`
        : values.content.trim();

      await createMessage({
        name: values.name.trim(),
        email: values.email.trim(),
        content: finalContent,
      });
      setValues(initialValues);
      setStatus("success");
      setToast({ isVisible: true, message: content.toast_success, type: "success" });
    } catch (error) {
      setStatus("error");
      setToast({ isVisible: true, message: getApiErrorMessage(error, content.toast_error), type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="editorial-shell contact-main">
      <section className="contact-copy" aria-labelledby="contact-title">
        <p className="eyebrow eyebrow--technical">{content.eyebrow}</p>
        <h1 id="contact-title" className="display-title">{content.title}</h1>
        <p className="lede">{content.description}</p>
        <p className="availability">{content.availability_label}</p>

        <div className="quick-contact-pills" aria-label="Jalur Kontak Cepat">
          <a
            href="https://github.com/Marshel2727"
            target="_blank"
            rel="noreferrer"
            className="quick-contact-pill"
          >
            <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub @Marshel2727
          </a>
        </div>
      </section>

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        {/* Interactive Brief Category Chips */}
        <div className="contact-brief-selector" role="group" aria-label="Pilih Fokus Diskusi">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono-editorial)", fontSize: 11, fontWeight: 700, color: "var(--technical)", textTransform: "uppercase" }}>
              FOKUS KEBUTUHAN PROYEK (OPSIONAL)
            </span>
            {selectedBriefType && (
              <button
                type="button"
                onClick={() => setSelectedBriefType(null)}
                style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-mono-editorial)", fontWeight: 600 }}
              >
                Reset Pilihan ×
              </button>
            )}
          </div>
          <div className="contact-brief-pills">
            {projectTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                className={`contact-brief-pill${selectedBriefType === type.label ? " contact-brief-pill--active" : ""}`}
                onClick={() => setSelectedBriefType(selectedBriefType === type.label ? null : type.label)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <p className="eyebrow eyebrow--technical" style={{ color: "var(--ink)", margin: 0 }}>
          {content.form_eyebrow}
        </p>

        {status === "success" && (
          <div className="status-banner status-banner--success" role="status">
            {content.success_message}
          </div>
        )}
        {status === "error" && (
          <div className="status-banner status-banner--error" role="alert">
            {content.error_message}
          </div>
        )}

        <div className="contact-form__row">
          <div className="form-field">
            <label htmlFor="contact-name">{content.name_label}</label>
            <input
              id="contact-name"
              name="name"
              autoComplete="name"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "contact-name-error" : undefined}
              placeholder={content.name_placeholder}
              disabled={isSending}
            />
            <p className="field-error" id="contact-name-error">{errors.name || " "}</p>
          </div>

          <div className="form-field">
            <label htmlFor="contact-email">{content.email_label}</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "contact-email-error" : undefined}
              placeholder={content.email_placeholder}
              disabled={isSending}
            />
            <p className="field-error" id="contact-email-error">{errors.email || " "}</p>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="contact-content">{content.message_label}</label>
          <textarea
            id="contact-content"
            name="content"
            rows={5}
            value={values.content}
            onChange={(event) => updateField("content", event.target.value)}
            aria-invalid={Boolean(errors.content)}
            aria-describedby={errors.content ? "contact-content-error" : undefined}
            placeholder={content.message_placeholder}
            disabled={isSending}
          />
          <p className="field-error" id="contact-content-error">{errors.content || " "}</p>
        </div>

        <div>
          <button className="button" type="submit" disabled={isSending}>
            {isSending ? content.submitting_label : content.submit_label}
          </button>
        </div>
      </form>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </main>
  );
}
