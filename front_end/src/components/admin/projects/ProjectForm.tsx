"use client";

import { useState, useEffect } from "react";
import { createProject, updateProject } from "@/services/project";
import { Project } from "@/types";

interface ProjectFormProps {
  projectToEdit: Project | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// ✅ DRY: State kosong didefinisikan sekali sebagai konstanta, dipakai di
// useEffect reset maupun setelah submit — sebelumnya ditulis manual dua kali.
const EMPTY_FORM = { title: "", description: "", demoUrl: "", githubUrl: "" };

export default function ProjectForm({ projectToEdit, onSuccess, onCancel }: ProjectFormProps) {
  const [fields, setFields] = useState(EMPTY_FORM);
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ DRY: Satu helper untuk update field, menggantikan setter terpisah
  const setField = (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));

  useEffect(() => {
    if (projectToEdit) {
      setFields({
        title:       projectToEdit.title,
        description: projectToEdit.description,
        demoUrl:     projectToEdit.demo_url || "",
        githubUrl:   projectToEdit.github_url || "",
      });
    } else {
      setFields(EMPTY_FORM);
    }
    setImage(null);
  }, [projectToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectToEdit && !image) {
      alert("Gambar wajib diunggah untuk project baru!");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", fields.title);
      formData.append("description", fields.description);
      if (fields.demoUrl)   formData.append("demo_url",   fields.demoUrl);
      if (fields.githubUrl) formData.append("github_url", fields.githubUrl);
      if (image)            formData.append("image",      image);

      if (projectToEdit) {
        await updateProject(projectToEdit.id, formData);
      } else {
        await createProject(formData);
        alert("Project berhasil ditambahkan!");
      }

      // ✅ DRY: Reset cukup sekali pakai konstanta EMPTY_FORM
      setFields(EMPTY_FORM);
      setImage(null);
      onSuccess();
    } catch (error) {
      console.error("Gagal menyimpan proyek", error);
      alert("Terjadi kesalahan saat menyimpan proyek.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between border-b border-gray-700 pb-4">
          <h2 className="text-2xl font-bold text-white">
            {projectToEdit ? "✏️ Edit Proyek" : "✨ Tambah Proyek Baru"}
          </h2>
          <button onClick={onCancel} className="text-2xl text-gray-400 transition-colors hover:text-red-500">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Judul Proyek *</label>
              <input
                type="text" value={fields.title} onChange={setField("title")} required
                className="w-full rounded bg-gray-900 p-2 text-white border border-gray-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Gambar Sampul{" "}
                {projectToEdit
                  ? <span className="text-xs text-gray-500">(Abaikan jika tidak ganti)</span>
                  : "*"}
              </label>
              <input
                id="image-upload" type="file"
                accept="image/png, image/jpeg, image/jpg, image/gif"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full rounded bg-gray-900 p-1.5 text-white border border-gray-600 file:mr-4 file:rounded file:border-0 file:bg-teal-600 file:px-4 file:py-1 file:text-white hover:file:bg-teal-700 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-300">Deskripsi Proyek *</label>
              <textarea
                value={fields.description} onChange={setField("description")} required rows={4}
                className="w-full rounded bg-gray-900 p-2 text-white border border-gray-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Demo URL <span className="text-xs text-gray-500">(Opsional)</span>
              </label>
              <input
                type="url" placeholder="https://..." value={fields.demoUrl} onChange={setField("demoUrl")}
                className="w-full rounded bg-gray-900 p-2 text-white border border-gray-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                GitHub URL <span className="text-xs text-gray-500">(Opsional)</span>
              </label>
              <input
                type="url" placeholder="https://github.com/..." value={fields.githubUrl} onChange={setField("githubUrl")}
                className="w-full rounded bg-gray-900 p-2 text-white border border-gray-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4">
            <button
              type="button" onClick={onCancel}
              className="rounded bg-gray-700 px-6 py-2 font-medium text-gray-300 transition-colors hover:bg-gray-600"
            >
              Batal
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="rounded bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-teal-800 disabled:opacity-50 shadow-lg shadow-teal-500/20"
            >
              {isSubmitting ? "Menyimpan..." : projectToEdit ? "Simpan Perubahan" : "Simpan Proyek"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
