"use client";

import { useState, useEffect } from "react";
import { createSkill, updateSkill } from "@/services/Skils";
import { getAllProjects } from "@/services/project";
import { Project, Skill } from "@/types";
import { getImageUrl } from "@/lib/utils";

interface SkillFormProps {
  skillToEdit: Skill | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SkillForm({ skillToEdit, onSuccess, onCancel }: SkillFormProps) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("intermediate");
  const [category, setCategory] = useState("");
  const [detail, setDetail] = useState("");
  const [proficiency, setProficiency] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (skillToEdit) {
      setName(skillToEdit.name);
      setLevel(skillToEdit.level?.toLowerCase() || "intermediate");
      setCategory(skillToEdit.category || "");
      setDetail(skillToEdit.detail || "");
      setProficiency(skillToEdit.proficiency?.toString() || "");
      setYearsExperience(skillToEdit.years_experience || "");
      setDisplayOrder(skillToEdit.display_order?.toString() || "0");
      setSelectedProjectIds(skillToEdit.projects?.map((project) => project.id) || []);
      setImage(null);
      setImagePreview(skillToEdit.icon_url ? getImageUrl(skillToEdit.icon_url) : null);
    } else {
      setName("");
      setLevel("intermediate");
      setCategory("Hardware & IoT");
      setDetail("");
      setProficiency("");
      setYearsExperience("Production Ready");
      setDisplayOrder("0");
      setSelectedProjectIds([]);
      setImage(null);
      setImagePreview(null);
    }
  }, [skillToEdit]);

  useEffect(() => {
    getAllProjects()
      .then(setAvailableProjects)
      .catch((error) => console.error("Gagal memuat daftar project", error));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleProject = (projectId: number) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!skillToEdit && !image) {
      alert("Icon/logo wajib diunggah untuk skill baru!");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("level", level);
      formData.append("category", category.trim() || "Lainnya");
      formData.append("detail", detail.trim());
      formData.append("proficiency", proficiency || "80");
      formData.append("years_experience", yearsExperience.trim() || "Production Ready");
      formData.append("display_order", displayOrder || "0");
      formData.append("project_ids", JSON.stringify(selectedProjectIds));

      if (image) formData.append("icon_url", image);

      if (skillToEdit) {
        await updateSkill(skillToEdit.id, formData);
      } else {
        await createSkill(formData);
        alert("Skill baru berhasil ditambahkan!");
      }

      onSuccess();
    } catch (error) {
      console.error("Gagal menyimpan skill", error);
      alert("Terjadi kesalahan saat menyimpan skill.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-editorial-overlay p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-editorial-line bg-editorial-surface p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-editorial-line pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-editorial-technical">Skill Management</p>
            <h2 className="text-2xl font-bold text-editorial-ink">
              {skillToEdit ? `✏️ Edit Spesifikasi: ${skillToEdit.name}` : "✨ Tambah Skill & Spesifikasi Baru"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-2 text-editorial-muted transition-colors hover:bg-editorial-paper-deep hover:text-editorial-danger focus:outline-none"
            aria-label="Tutup"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Nama Skill */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                Nama Skill / Teknologi *
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="Contoh: ESP32, Next.js, Python"
                className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface p-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              />
            </div>

            {/* Tingkat Kemahiran */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                Tingkat Kemahiran / Level *
              </label>
              <select 
                value={level} 
                onChange={(e) => setLevel(e.target.value)} 
                className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface p-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              >
                <option value="expert">Core Stack (Expert / Rekayasa Utama)</option>
                <option value="advanced">Advanced (Produksi & Arsitektur)</option>
                <option value="intermediate">Proficient (Menengah / Terampil)</option>
                <option value="beginner">Working Knowledge (Dasar / Pemahaman)</option>
              </select>
            </div>

            {/* Kategori */}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                Kategori Disiplin *
              </label>
              <input
                type="text"
                list="category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                placeholder="Pilih atau ketik kategori (cth: Hardware & IoT)"
                className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface p-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              />
              <datalist id="category-suggestions">
                <option value="Hardware & IoT" />
                <option value="Frontend Systems" />
                <option value="Backend & API" />
                <option value="Database & Cloud" />
                <option value="DevOps & Tools" />
                <option value="Mobile & Embedded" />
              </datalist>
            </div>

            {/* Kapabilitas Teknis & Ekosistem */}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                Kapabilitas Teknis & Ekosistem (Detail Spesifikasi)
              </label>
              <textarea
                rows={2}
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                maxLength={180}
                placeholder="Contoh: FreeRTOS, MQTT, I2C/SPI Sensor Nodes, Power Optimization, PlatformIO"
                className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface p-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              />
              <p className="mt-1 text-xs text-editorial-muted">
                Teks ini akan muncul saat pengunjung mengklik kartu skill untuk melihat lembar spesifikasi teknis.
              </p>
            </div>

            {/* Status Pengalaman */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                Status / Lama Pengalaman
              </label>
              <input
                type="text"
                value={yearsExperience}
                onChange={(event) => setYearsExperience(event.target.value)}
                maxLength={50}
                placeholder="Contoh: 3+ Tahun / Production Ready"
                className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface p-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              />
            </div>

            {/* Urutan Tampil */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                Urutan Tampil (Display Order)
              </label>
              <input
                type="number"
                min="0"
                max="9999"
                value={displayOrder}
                onChange={(event) => setDisplayOrder(event.target.value)}
                className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface p-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              />
            </div>

            {/* Upload Icon & Preview */}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                Ikon / Logo Teknologi {skillToEdit ? "(Opsional jika tidak ganti)" : "*"}
              </label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-editorial-line bg-editorial-paper-deep p-2 shadow-inner">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-contain" />
                  </div>
                )}
                <input
                  id="skill-image-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                  onChange={handleImageChange}
                  className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface p-2 text-editorial-ink file:mr-4 file:rounded-md file:border-0 file:bg-editorial-action file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-editorial-on-action hover:file:bg-editorial-action-hover focus:outline-none"
                />
              </div>
            </div>

            {/* Project Terkait */}
            <fieldset className="md:col-span-2">
              <legend className="mb-2 text-sm font-semibold text-editorial-technical">
                Tautkan ke Proyek Terverifikasi (Cross-linking)
              </legend>
              <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-editorial-line-strong bg-editorial-paper-deep/60 p-3 sm:grid-cols-2">
                {availableProjects.length === 0 ? (
                  <p className="text-sm text-editorial-muted sm:col-span-2">Belum ada proyek yang tersedia di repositori.</p>
                ) : (
                  availableProjects.map((project) => {
                    const isChecked = selectedProjectIds.includes(project.id);
                    return (
                      <label
                        key={project.id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-md border p-2 text-sm transition ${
                          isChecked
                            ? "border-editorial-accent bg-editorial-surface shadow-sm font-semibold text-editorial-ink"
                            : "border-transparent text-editorial-muted hover:bg-editorial-surface/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProject(project.id)}
                          className="h-4 w-4 accent-editorial-accent"
                        />
                        <span className="truncate">{project.title}</span>
                      </label>
                    );
                  })
                )}
              </div>
              <p className="mt-1.5 text-xs text-editorial-muted">
                Proyek yang dipilih akan otomatis muncul sebagai bukti studi kasus ketika skill ini diinspeksi oleh pengunjung.
              </p>
            </fieldset>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-editorial-line pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-editorial-line bg-editorial-paper-deep px-5 py-2.5 font-medium text-editorial-ink transition hover:bg-editorial-paper"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-11 rounded-lg bg-editorial-action px-6 py-2.5 font-semibold text-editorial-on-action shadow-md transition hover:bg-editorial-action-hover disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : skillToEdit ? "Simpan Perubahan" : "Simpan Skill Baru"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
