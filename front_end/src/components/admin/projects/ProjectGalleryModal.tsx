"use client";

import { useState, useRef } from "react";
import { Project } from "@/types";
import { uploadProjectImage, deleteProjectImage } from "@/services/projectImages";
// ✅ DRY: Mengimpor getImageUrl dari lib/utils.ts, menghapus definisi lokal
import { getImageUrl } from "@/lib/utils";

interface ProjectGalleryModalProps {
  project: Project;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ProjectGalleryModal({ project, onClose, onRefresh }: ProjectGalleryModalProps) {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("project_id", project.id.toString());
      formData.append("image_file", uploadFile);
      if (uploadCaption) formData.append("caption", uploadCaption);

      await uploadProjectImage(formData);
      setUploadFile(null);
      setUploadCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onRefresh();
    } catch (error) {
      console.error("Gagal mengunggah foto", error);
      alert("Gagal mengunggah foto.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm("Hapus foto ini dari galeri?")) return;
    try {
      await deleteProjectImage(imageId);
      onRefresh();
    } catch (error) {
      console.error("Gagal menghapus foto", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-editorial-overlay p-4 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col rounded-2xl border border-editorial-line bg-editorial-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-editorial-line p-4 sm:p-6">
          <h3 className="text-lg font-bold text-editorial-ink sm:text-xl">
            Kelola Galeri: <span className="text-editorial-technical">{project.title}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-editorial-muted transition-colors hover:bg-editorial-paper-deep hover:text-editorial-danger focus:outline-none"
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-8 rounded-xl border border-editorial-line bg-editorial-paper-deep p-4 sm:p-5">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-editorial-technical">Tambah Foto Baru</h4>
            <form onSubmit={handleUpload} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="w-full sm:flex-1">
                <label className="mb-1 block text-xs text-editorial-muted">File Gambar *</label>
                <input
                  ref={fileInputRef} type="file" accept="image/*" required
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full rounded border border-editorial-line-strong bg-editorial-surface p-1.5 text-editorial-ink file:mr-4 file:rounded file:border-0 file:bg-editorial-action file:px-4 file:py-1 file:text-editorial-on-action hover:file:bg-editorial-action-hover focus:outline-none"
                />
              </div>
              <div className="w-full sm:flex-1">
                <label className="mb-1 block text-xs text-editorial-muted">Caption (Opsional)</label>
                <input
                  type="text" value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)}
                  maxLength={255}
                  placeholder="Contoh: Tampilan Login"
                  className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-2 text-sm text-editorial-ink focus:border-editorial-technical outline-none"
                />
              </div>
              <button
                type="submit" disabled={isUploading || !uploadFile}
                className="min-h-11 w-full rounded bg-editorial-action px-6 py-2 text-sm font-medium text-editorial-on-action transition hover:bg-editorial-action-hover disabled:opacity-50 sm:w-auto sm:text-base"
              >
                {isUploading ? "Mengunggah..." : "Upload"}
              </button>
            </form>
          </div>

          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-editorial-technical">Foto Tersimpan</h4>

          {project.gallery && project.gallery.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {project.gallery.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-lg border border-editorial-line bg-editorial-paper-deep">
                  <img
                    src={getImageUrl(img.image_url)}
                    alt={img.caption || "Gallery Image"}
                    className="h-40 w-full object-cover sm:h-32"
                  />
                  {img.caption && (
                    <div className="absolute bottom-0 w-full truncate border-t border-editorial-line bg-editorial-surface/90 p-2 text-xs text-editorial-ink backdrop-blur-sm">
                      {img.caption}
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-editorial-danger text-editorial-on-action opacity-0 shadow-lg transition hover:bg-editorial-danger/90 group-hover:opacity-100 sm:opacity-100 md:opacity-0"
                    title="Hapus Foto"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-editorial-line-strong bg-editorial-paper-deep py-8 text-center text-editorial-muted">
              Belum ada foto tambahan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
