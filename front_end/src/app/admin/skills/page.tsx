"use client";

import { useState } from "react";
import useSWR from "swr";
import { Skill } from "@/types";
// PERBAIKAN: Pastikan ejaan nama file ini sesuai dengan yang ada di foldermu
import { getAllSkill } from "@/services/Skils";
import SkillForm from "@/components/admin/skills/SkillForm";
import SkillList from "@/components/admin/skills/SkillList";

export default function SkillAdminPage() {
  const { data: skills = [], isLoading, mutate } = useSWR("admin/skills", getAllSkill);
  const [skillToEdit, setSkillToEdit] = useState<Skill | null>(null);

  const handleSuccess = () => {
    setSkillToEdit(null); // Tutup mode edit (kembali ke form kosong)
    mutate();             // Refresh tabel data terbaru
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white text-center">Kelola Skill</h1>

      <SkillForm
        skillToEdit={skillToEdit}
        // isLoading={isLoading} <-- Form biasanya tidak butuh ini dari bos, dia punya isSubmitting sendiri
        onCancel={() => setSkillToEdit(null)} // ✅ PERBAIKAN: Typo "Cancle" diperbaiki
        onSuccess={handleSuccess}             // ✅ PERBAIKAN: Fungsi sukses dimasukkan!
      />

      <SkillList
        skills={skills}
        isLoading={isLoading}
        onRefresh={mutate}
        onEdit={(skill) => setSkillToEdit(skill)} // ✅ PERBAIKAN: Mengganti parameter "skils" jadi "skill"
      />
    </div>
  );
}