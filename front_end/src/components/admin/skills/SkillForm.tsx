"use client";

import { useState, useEffect } from "react";
import { createSkill, updateSkill } from "@/services/Skils";
import { Skill } from "@/types";

interface SkillFormProps {
  skillToEdit: Skill | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SkillForm({ skillToEdit, onSuccess, onCancel }: SkillFormProps) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (skillToEdit) {
      setName(skillToEdit.name);
      setLevel(skillToEdit.level);
      setImage(null);
    } else {
      setName("");
      setLevel("Beginner");
      setImage(null);
    }
  }, [skillToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!skillToEdit && !image) {
      alert("Gambar wajib diunggah untuk skill baru!");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("level", level);

      if (image) formData.append("icon_url", image);

      if (skillToEdit) {
        await updateSkill(skillToEdit.id, formData);
      } else {
        await createSkill(formData);
        alert("Skill berhasil ditambahkan!");
      }

      const fileInput = document.getElementById("skill-image-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      onSuccess();
    } catch (error) {
      console.error("Gagal menyimpan skill", error);
      alert("Terjadi Kesalahan saat menyimpan skill.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-gray-750 bg-gray-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between border-b border-gray-800 pb-4">
          <h2 className="text-2xl font-bold text-white">
            {skillToEdit ? "✏️ Edit Skill" : "✨ Tambah Skill Baru"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-red-500 transition-colors focus:outline-none"
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
              <label className="mb-1 block text-sm font-medium text-gray-300">Nama Skill *</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="Contoh: React.js, Python"
                className="w-full rounded bg-gray-950 p-2 text-white border border-gray-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500" 
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Tingkat Kemahiran *</label>
              <select 
                value={level} 
                onChange={(e) => setLevel(e.target.value)} 
                className="w-full rounded bg-gray-950 p-2 text-white border border-gray-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Ikon Skill {skillToEdit ? "(Abaikan jika tidak ganti)" : "*"}
              </label>
              <input 
                id="skill-image-upload" 
                type="file" 
                accept="image/png, image/jpeg, image/jpg, image/svg+xml" 
                onChange={(e) => setImage(e.target.files?.[0] || null)} 
                className="w-full rounded bg-gray-950 p-1.5 text-white border border-gray-800 file:mr-4 file:rounded file:border-0 file:bg-teal-600 file:px-4 file:py-1 file:text-white hover:file:bg-teal-700 focus:outline-none" 
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
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-teal-800 disabled:opacity-50 shadow-lg shadow-teal-500/20"
            >
              {isSubmitting ? "Menyimpan..." : (skillToEdit ? "Simpan Perubahan" : "Simpan Skill")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}