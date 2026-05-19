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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white sm:text-xl">
            Kelola Galeri: <span className="text-teal-400">{project.title}</span>
          </h3>
          <button onClick={onClose} className="text-3xl text-gray-400 transition hover:text-red-500 leading-none">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-8 rounded-xl border border-gray-700 bg-gray-800 p-4 sm:p-5">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">Tambah Foto Baru</h4>
            <form onSubmit={handleUpload} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="w-full sm:flex-1">
                <label className="mb-1 block text-xs text-gray-400">File Gambar *</label>
                <input
                  ref={fileInputRef} type="file" accept="image/*" required
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full rounded bg-gray-900 p-1.5 text-white border border-gray-600 file:mr-4 file:rounded file:border-0 file:bg-teal-600 file:px-4 file:py-1 file:text-white hover:file:bg-teal-700 focus:outline-none"
                />
              </div>
              <div className="w-full sm:flex-1">
                <label className="mb-1 block text-xs text-gray-400">Caption (Opsional)</label>
                <input
                  type="text" value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Contoh: Tampilan Login"
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-teal-500 outline-none"
                />
              </div>
              <button
                type="submit" disabled={isUploading || !uploadFile}
                className="w-full rounded bg-teal-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-50 sm:w-auto sm:text-base"
              >
                {isUploading ? "Mengunggah..." : "Upload"}
              </button>
            </form>
          </div>

          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">Foto Tersimpan</h4>

          {project.gallery && project.gallery.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {project.gallery.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
                  <img
                    src={getImageUrl(img.image_url)}
                    alt={img.caption || "Gallery Image"}
                    className="h-40 w-full object-cover sm:h-32"
                  />
                  {img.caption && (
                    <div className="absolute bottom-0 w-full truncate bg-gray-900/90 p-2 text-xs text-gray-300 backdrop-blur-sm border-t border-gray-700">
                      {img.caption}
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow-lg transition hover:bg-red-700 group-hover:opacity-100 sm:opacity-100 md:opacity-0"
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
            <p className="rounded-xl border border-dashed border-gray-700 py-8 text-center text-gray-500 bg-gray-800/50">
              Belum ada foto tambahan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
