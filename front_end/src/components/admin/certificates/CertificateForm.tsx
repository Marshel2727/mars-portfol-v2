"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import {
  compressImageForUpload,
  formatFileSize,
  MAX_SOURCE_IMAGE_BYTES,
  MAX_UPLOAD_IMAGE_BYTES,
} from "@/lib/imageCompress";
import { getImageUrl } from "@/lib/utils";
import { getApiErrorMessage } from "@/services/api";
import { createCertificate, updateCertificate } from "@/services/certificates";
import { Certificate } from "@/types";

interface CertificateFormProps {
  certificateToEdit: Certificate | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORY_OPTIONS = [
  "Web Development",
  "IoT & Embedded",
  "Cloud & Backend",
  "Kompetisi & Penghargaan",
  "AI & Data",
  "Lainnya",
];

const ALLOWED_IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const ALLOWED_IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp"]);
const MAX_PDF_BYTES = 10 * 1024 * 1024;

function buildInitialFields(certificate: Certificate | null) {
  return {
    title: certificate?.title || "",
    issuer: certificate?.issuer || "",
    category: certificate?.category || "",
    issueDate: certificate?.issue_date || "",
    credentialId: certificate?.credential_id || "",
    credentialUrl: certificate?.credential_url || "",
    description: certificate?.description || "",
    displayOrder: String(certificate?.display_order ?? 0),
  };
}

function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || getFileExtension(file.name) === "pdf";
}

function isSupportedImageFile(file: File): boolean {
  return ALLOWED_IMAGE_MIME.has(file.type) || ALLOWED_IMAGE_EXT.has(getFileExtension(file.name));
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function CertificateForm({
  certificateToEdit,
  onSuccess,
  onCancel,
}: CertificateFormProps) {
  const notify = useAdminToast();
  const [fields, setFields] = useState(() => buildInitialFields(certificateToEdit));
  const [isFeatured, setIsFeatured] = useState(() => Boolean(certificateToEdit?.is_featured));
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const compressRequestRef = useRef(0);

  const objectUrl = useObjectUrl(file);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onCancel]);

  const setField =
    (key: keyof ReturnType<typeof buildInitialFields>) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((prev) => ({ ...prev, [key]: event.target.value }));

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const requestId = ++compressRequestRef.current;
    const input = event.target;
    const selected = input.files?.[0] || null;
    if (!selected) {
      setIsCompressing(false);
      setFile(null);
      return;
    }

    const pdf = isPdfFile(selected);
    const image = isSupportedImageFile(selected);

    if (!pdf && !image) {
      notify("Format file harus PNG, JPG, WebP, atau PDF.", "error");
      input.value = "";
      return;
    }

    if (pdf) {
      if (selected.size > MAX_PDF_BYTES) {
        notify("Ukuran file PDF sertifikat maksimal 10 MB.", "error");
        input.value = "";
        return;
      }
      setFile(selected);
      return;
    }

    if (selected.size > MAX_SOURCE_IMAGE_BYTES) {
      notify("Ukuran gambar sumber maksimal 20 MB.", "error");
      input.value = "";
      return;
    }

    setIsCompressing(true);
    try {
      const optimized = await compressImageForUpload(selected, {
        maxDimension: 1920,
        quality: 0.85,
      });
      if (requestId !== compressRequestRef.current) return;

      if (optimized.size > MAX_UPLOAD_IMAGE_BYTES) {
        notify("Ukuran gambar sertifikat masih melebihi 5 MB setelah kompresi.", "error");
        input.value = "";
        return;
      }

      setFile(optimized);
    } finally {
      if (requestId === compressRequestRef.current) {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTitle = fields.title.trim();
    const trimmedIssuer = fields.issuer.trim();
    const trimmedUrl = fields.credentialUrl.trim();
    const orderText = fields.displayOrder.trim() || "0";

    if (!trimmedTitle) {
      notify("Judul sertifikat wajib diisi.", "error");
      return;
    }

    if (!trimmedIssuer) {
      notify("Nama penerbit sertifikat wajib diisi.", "error");
      return;
    }

    if (trimmedUrl && !isValidHttpUrl(trimmedUrl)) {
      notify("URL verifikasi kredensial harus diawali http:// atau https://.", "error");
      return;
    }

    if (!/^\d+$/.test(orderText)) {
      notify("Urutan tampil harus berupa bilangan bulat 0 hingga 9999.", "error");
      return;
    }

    const parsedOrder = Number(orderText);
    if (parsedOrder < 0 || parsedOrder > 9999) {
      notify("Urutan tampil harus bernilai antara 0 hingga 9999.", "error");
      return;
    }

    if (!certificateToEdit && !file) {
      notify("Dokumen sertifikat (PNG, JPG, WebP, atau PDF) wajib diunggah!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", trimmedTitle);
      formData.append("issuer", trimmedIssuer);
      formData.append("category", fields.category.trim() || "Lainnya");
      formData.append("issue_date", fields.issueDate.trim());
      formData.append("credential_id", fields.credentialId.trim());
      formData.append("credential_url", trimmedUrl);
      formData.append("description", fields.description.trim());
      formData.append("is_featured", String(isFeatured));
      formData.append("display_order", String(parsedOrder));
      if (file) {
        formData.append("file", file);
      }

      if (certificateToEdit) {
        await updateCertificate(certificateToEdit.id, formData);
      } else {
        await createCertificate(formData);
      }

      notify(
        certificateToEdit
          ? "Sertifikat berhasil diperbarui!"
          : "Sertifikat berhasil ditambahkan!"
      );
      onSuccess();
    } catch (error) {
      console.error("Gagal menyimpan sertifikat", error);
      notify(
        getApiErrorMessage(error, "Terjadi kesalahan saat menyimpan sertifikat."),
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasPreview = Boolean(file || certificateToEdit?.file_url);
  const previewIsPdf = file
    ? isPdfFile(file)
    : certificateToEdit?.file_type === "pdf";
  const previewUrl = file
    ? objectUrl
    : certificateToEdit?.file_url
      ? getImageUrl(certificateToEdit.file_url)
      : undefined;
  const previewFilename = file
    ? file.name
    : certificateToEdit?.file_url?.split("/").pop() || certificateToEdit?.title || "Dokumen PDF";

  const inputClass =
    "w-full rounded-lg border border-editorial-line-strong bg-editorial-surface p-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-editorial-overlay p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="certificate-form-title"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-editorial-line bg-editorial-surface p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-editorial-line pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-editorial-technical">
              Certificate Management
            </p>
            <h2 id="certificate-form-title" className="text-2xl font-bold text-editorial-ink">
              {certificateToEdit
                ? `✏️ Edit Sertifikat: ${certificateToEdit.title}`
                : "✨ Tambah Sertifikat & Lisensi Baru"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-full p-2 text-editorial-muted transition-colors hover:bg-editorial-paper-deep hover:text-editorial-danger focus:outline-none disabled:opacity-50"
            aria-label="Tutup"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Judul Sertifikat */}
            <div className="md:col-span-2">
              <label
                htmlFor="certificate-title"
                className="mb-1.5 block text-sm font-semibold text-editorial-technical"
              >
                Judul Sertifikat / Lisensi *
              </label>
              <input
                id="certificate-title"
                type="text"
                value={fields.title}
                onChange={setField("title")}
                required
                maxLength={200}
                placeholder="Contoh: AWS Certified Cloud Practitioner"
                className={inputClass}
              />
            </div>

            {/* Penerbit */}
            <div>
              <label
                htmlFor="certificate-issuer"
                className="mb-1.5 block text-sm font-semibold text-editorial-technical"
              >
                Penerbit / Lembaga *
              </label>
              <input
                id="certificate-issuer"
                type="text"
                value={fields.issuer}
                onChange={setField("issuer")}
                required
                maxLength={150}
                placeholder="Contoh: Amazon Web Services, Dicoding"
                className={inputClass}
              />
            </div>

            {/* Tanggal Terbit */}
            <div>
              <label
                htmlFor="certificate-issue-date"
                className="mb-1.5 block text-sm font-semibold text-editorial-technical"
              >
                Tanggal Terbit
              </label>
              <input
                id="certificate-issue-date"
                type="text"
                value={fields.issueDate}
                onChange={setField("issueDate")}
                maxLength={50}
                placeholder="Contoh: Mei 2026"
                className={inputClass}
              />
            </div>

            {/* Kategori */}
            <div>
              <label
                htmlFor="certificate-category"
                className="mb-1.5 block text-sm font-semibold text-editorial-technical"
              >
                Kategori
              </label>
              <input
                id="certificate-category"
                type="text"
                list="certificate-category-suggestions"
                value={fields.category}
                onChange={setField("category")}
                maxLength={100}
                placeholder="Pilih atau ketik kategori (default: Lainnya)"
                className={inputClass}
              />
              <datalist id="certificate-category-suggestions">
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>

            {/* Urutan Tampil */}
            <div>
              <label
                htmlFor="certificate-display-order"
                className="mb-1.5 block text-sm font-semibold text-editorial-technical"
              >
                Urutan Tampil (0–9999)
              </label>
              <input
                id="certificate-display-order"
                type="number"
                min={0}
                max={9999}
                step={1}
                value={fields.displayOrder}
                onChange={setField("displayOrder")}
                className={inputClass}
              />
            </div>

            {/* ID Kredensial */}
            <div>
              <label
                htmlFor="certificate-credential-id"
                className="mb-1.5 block text-sm font-semibold text-editorial-technical"
              >
                ID Kredensial
              </label>
              <input
                id="certificate-credential-id"
                type="text"
                value={fields.credentialId}
                onChange={setField("credentialId")}
                maxLength={120}
                placeholder="Contoh: CERT-2026-001"
                className={inputClass}
              />
            </div>

            {/* URL Verifikasi */}
            <div>
              <label
                htmlFor="certificate-credential-url"
                className="mb-1.5 block text-sm font-semibold text-editorial-technical"
              >
                URL Verifikasi Kredensial
              </label>
              <input
                id="certificate-credential-url"
                type="url"
                value={fields.credentialUrl}
                onChange={setField("credentialUrl")}
                maxLength={500}
                placeholder="https://www.credly.com/badges/..."
                className={inputClass}
              />
            </div>

            {/* Deskripsi */}
            <div className="md:col-span-2">
              <label
                htmlFor="certificate-description"
                className="mb-1.5 block text-sm font-semibold text-editorial-technical"
              >
                Deskripsi Singkat
              </label>
              <textarea
                id="certificate-description"
                rows={3}
                value={fields.description}
                onChange={setField("description")}
                maxLength={500}
                placeholder="Ringkasan kompetensi, proyek akhir, atau pencapaian dalam sertifikasi ini..."
                className={inputClass}
              />
              <p className="mt-1 text-right text-xs text-editorial-muted">
                {fields.description.length}/500 karakter
              </p>
            </div>

            {/* Featured */}
            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-editorial-line bg-editorial-paper-deep/60 p-3 text-sm font-medium text-editorial-ink transition hover:border-editorial-line-strong">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                  className="h-4 w-4 accent-editorial-accent"
                />
                <span>Tandai sebagai Sertifikat Unggulan (Featured)</span>
              </label>
            </div>

            {/* Upload File Sertifikat */}
            <div className="md:col-span-2">
              <label
                htmlFor="certificate-file-upload"
                className="mb-1.5 block text-sm font-semibold text-editorial-technical"
              >
                File Sertifikat (PNG, JPG, WebP, atau PDF){" "}
                {certificateToEdit ? "(Opsional jika tidak diganti)" : "*"}
              </label>
              <input
                id="certificate-file-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={(event) => {
                  void handleFileChange(event);
                }}
                className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface p-2 text-editorial-ink file:mr-4 file:rounded-md file:border-0 file:bg-editorial-action file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-editorial-on-action hover:file:bg-editorial-action-hover focus:outline-none"
              />
              <p className="mt-1 text-xs text-editorial-muted">
                Gambar (PNG/JPG/WebP) otomatis dikompres ke WebP, atau dokumen PDF maksimal 10 MB.
              </p>
              {isCompressing && (
                <p className="mt-1.5 text-xs text-editorial-technical">
                  Mengompres gambar sertifikat ke WebP...
                </p>
              )}

              {hasPreview && (
                <div className="mt-3 rounded-lg border border-editorial-line bg-editorial-paper-deep/60 p-3">
                  {previewIsPdf ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-editorial-danger/30 bg-editorial-danger/10 text-xs font-bold text-editorial-danger">
                          PDF
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-editorial-ink">
                            {previewFilename}
                          </p>
                          <p className="text-xs text-editorial-muted">
                            {file ? "Dokumen PDF siap diunggah" : "Dokumen PDF tersimpan"}
                          </p>
                        </div>
                      </div>
                      {previewUrl && (
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md border border-editorial-technical/30 bg-editorial-technical/10 px-3 py-1.5 text-xs font-semibold text-editorial-technical transition hover:bg-editorial-technical hover:text-editorial-on-action"
                        >
                          Buka PDF ↗
                        </a>
                      )}
                    </div>
                  ) : (
                    previewUrl && (
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md border border-editorial-line bg-editorial-surface">
                          <img
                            src={previewUrl}
                            alt="Pratinjau sertifikat"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-editorial-ink">
                            {previewFilename}
                          </p>
                          <p className="text-xs text-editorial-muted">
                            {file
                              ? `Gambar siap diunggah (${formatFileSize(file.size)})`
                              : "Gambar sertifikat tersimpan"}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-editorial-line pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-lg border border-editorial-line bg-editorial-paper-deep px-5 py-2.5 font-medium text-editorial-ink transition hover:bg-editorial-paper disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="min-h-11 rounded-lg bg-editorial-action px-6 py-2.5 font-semibold text-editorial-on-action shadow-md transition hover:bg-editorial-action-hover disabled:opacity-50"
            >
              {isSubmitting
                ? "Menyimpan..."
                : certificateToEdit
                  ? "Simpan Perubahan"
                  : "Simpan Sertifikat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
