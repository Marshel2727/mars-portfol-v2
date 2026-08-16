"use client";

import { useState, useEffect } from "react";
import { createProject, updateProject } from "@/services/project";
import { getAllSkill } from "@/services/Skils";
import { Project, Skill } from "@/types";

interface ProjectFormProps {
  projectToEdit: Project | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// ✅ DRY: State kosong didefinisikan sekali sebagai konstanta, dipakai di
// useEffect reset maupun setelah submit — sebelumnya ditulis manual dua kali.
const EMPTY_FORM = {
  title: "",
  subTitle: "",
  description: "",
  demoUrl: "",
  githubUrl: "",
  category: "",
  techTags: "",
  architectureSteps: "",
};

function parseArchitectureSteps(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const [label, title, ...descriptionParts] = line.split("|").map((part) => part.trim());
    const description = descriptionParts.join(" | ");
    if (!title || !description) {
      throw new Error(`Baris arsitektur ${index + 1} harus memakai format: nomor | judul | deskripsi`);
    }
    return { label: label || String(index + 1).padStart(2, "0"), title, description };
  });
}

export default function ProjectForm({ projectToEdit, onSuccess, onCancel }: ProjectFormProps) {
  const [fields, setFields] = useState(EMPTY_FORM);
  const [image, setImage] = useState<File | null>(null);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ DRY: Satu helper untuk update field, menggantikan setter terpisah
  const setField = (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));

  useEffect(() => {
    if (projectToEdit) {
      setFields({
        title:       projectToEdit.title,
        subTitle:    projectToEdit.sub_title || "",
        description: projectToEdit.description,
        demoUrl:     projectToEdit.demo_url || "",
        githubUrl:   projectToEdit.github_url || "",
        category:    projectToEdit.category || "",
        techTags:    projectToEdit.tech_tags?.join(", ") || "",
        architectureSteps: projectToEdit.architecture_steps?.map((step, index) =>
          `${step.label || String(index + 1).padStart(2, "0")} | ${step.title} | ${step.description}`
        ).join("\n") || "",
      });
      setSelectedSkillIds(projectToEdit.skills?.map((skill) => skill.id) || []);
    } else {
      setFields(EMPTY_FORM);
      setSelectedSkillIds([]);
    }
    setImage(null);
  }, [projectToEdit]);

  useEffect(() => {
    getAllSkill()
      .then(setAvailableSkills)
      .catch((error) => console.error("Gagal memuat daftar skill", error));
  }, []);

  const toggleSkill = (skillId: number) => {
    setSelectedSkillIds((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId]
    );
  };

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
      formData.append("sub_title", fields.subTitle);
      formData.append("description", fields.description);
      formData.append("demo_url", fields.demoUrl);
      formData.append("github_url", fields.githubUrl);
      formData.append("category", fields.category.trim() || "Lainnya");
      formData.append(
        "tech_tags",
        JSON.stringify(fields.techTags.split(",").map((tag) => tag.trim()).filter(Boolean))
      );
      formData.append("skill_ids", JSON.stringify(selectedSkillIds));
      formData.append("architecture_steps", JSON.stringify(parseArchitectureSteps(fields.architectureSteps)));
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
      setSelectedSkillIds([]);
      onSuccess();
    } catch (error) {
      console.error("Gagal menyimpan proyek", error);
      alert("Terjadi kesalahan saat menyimpan proyek.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-editorial-overlay p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-editorial-line bg-editorial-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between border-b border-editorial-line pb-4">
          <h2 className="text-2xl font-bold text-editorial-ink">
            {projectToEdit ? "✏️ Edit Proyek" : "✨ Tambah Proyek Baru"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-editorial-technical">Judul Proyek *</label>
              <input
                type="text" value={fields.title} onChange={setField("title")} required
                className="w-full rounded border border-editorial-line-strong bg-editorial-surface p-2 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-editorial-technical">Kategori Proyek *</label>
              <input
                type="text" value={fields.category} onChange={setField("category")} required
                placeholder="Contoh: Full-Stack, AI, IoT"
                className="w-full rounded border border-editorial-line-strong bg-editorial-surface p-2 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-editorial-technical">
                Subjudul <span className="text-xs text-editorial-muted">(Opsional)</span>
              </label>
              <input
                type="text"
                value={fields.subTitle}
                onChange={setField("subTitle")}
                maxLength={150}
                placeholder="Ringkasan singkat yang tampil pada kartu dan detail project"
                className="w-full rounded border border-editorial-line-strong bg-editorial-surface p-2 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-editorial-technical">
                Gambar Sampul{" "}
                {projectToEdit
                  ? <span className="text-xs text-editorial-muted">(Abaikan jika tidak ganti)</span>
                  : "*"}
              </label>
              <input
                id="image-upload" type="file"
                accept="image/png, image/jpeg, image/jpg, image/gif"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full rounded border border-editorial-line-strong bg-editorial-surface p-1.5 text-editorial-ink file:mr-4 file:rounded file:border-0 file:bg-editorial-action file:px-4 file:py-1 file:text-editorial-on-action hover:file:bg-editorial-action-hover focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-editorial-technical">Deskripsi Proyek *</label>
              <textarea
                value={fields.description} onChange={setField("description")} required rows={4}
                className="w-full rounded border border-editorial-line-strong bg-editorial-surface p-2 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-editorial-technical">Tech Tags</label>
              <input
                type="text" value={fields.techTags} onChange={setField("techTags")}
                placeholder="Next.js, Flask, MySQL, Docker"
                className="w-full rounded border border-editorial-line-strong bg-editorial-surface p-2 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              />
              <p className="mt-1 text-xs text-editorial-muted">Pisahkan setiap teknologi dengan koma.</p>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-editorial-technical">Alur Arsitektur Project</label>
              <textarea
                value={fields.architectureSteps}
                onChange={setField("architectureSteps")}
                rows={5}
                placeholder={"01 | Client Interface | Next.js dan dashboard pengguna\n02 | API & Routing | REST API dan autentikasi\n03 | Data & Hardware | Database dan node IoT"}
                className="w-full rounded border border-editorial-line-strong bg-editorial-surface p-2 font-mono text-sm text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              />
              <p className="mt-1 text-xs text-editorial-muted">Satu langkah per baris: nomor | judul | deskripsi. Kosongkan jika blok arsitektur tidak perlu ditampilkan.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-editorial-technical">
                Demo URL <span className="text-xs text-editorial-muted">(Opsional)</span>
              </label>
              <input
                type="url" placeholder="https://..." value={fields.demoUrl} onChange={setField("demoUrl")}
                className="w-full rounded border border-editorial-line-strong bg-editorial-surface p-2 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-editorial-technical">
                GitHub URL <span className="text-xs text-editorial-muted">(Opsional)</span>
              </label>
              <input
                type="url" placeholder="https://github.com/..." value={fields.githubUrl} onChange={setField("githubUrl")}
                className="w-full rounded border border-editorial-line-strong bg-editorial-surface p-2 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              />
            </div>
            <fieldset className="md:col-span-2">
              <legend className="mb-2 text-sm font-medium text-editorial-technical">Skill yang Digunakan</legend>
              <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded border border-editorial-line-strong bg-editorial-paper-deep p-3 sm:grid-cols-2">
                {availableSkills.length === 0 ? (
                  <p className="text-sm text-editorial-muted sm:col-span-2">Belum ada skill yang tersedia.</p>
                ) : availableSkills.map((skill) => (
                  <label key={skill.id} className="flex cursor-pointer items-center gap-2 text-sm text-editorial-ink">
                    <input
                      type="checkbox"
                      checked={selectedSkillIds.includes(skill.id)}
                      onChange={() => toggleSkill(skill.id)}
                      className="h-4 w-4 accent-editorial-accent"
                    />
                    <span>{skill.name}</span>
                    <span className="text-xs text-editorial-muted">{skill.category}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4">
            <button
              type="button" onClick={onCancel}
              className="rounded bg-editorial-paper-deep px-6 py-2 font-medium text-editorial-ink transition-colors hover:bg-editorial-paper"
            >
              Batal
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="min-h-11 rounded bg-editorial-action px-6 py-2 font-medium text-editorial-on-action shadow-lg transition-colors hover:bg-editorial-action-hover disabled:bg-editorial-action-hover disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : projectToEdit ? "Simpan Perubahan" : "Simpan Proyek"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
