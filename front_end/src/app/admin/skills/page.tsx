"use client";

import { useState } from "react";
import useSWR from "swr";
import { Skill } from "@/types";
// PERBAIKAN: Pastikan ejaan nama file ini sesuai dengan yang ada di foldermu
import { getAllSkill } from "@/services/Skils";
import SkillForm from "@/components/admin/skills/SkillForm";
import SkillList from "@/components/admin/skills/SkillList";

export default function SkillAdminPage() {
  const { data: rawSkills, isLoading, mutate } = useSWR("/skills/", () => getAllSkill());
  const skills = Array.isArray(rawSkills) ? rawSkills : [];
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [skillToEdit, setSkillToEdit] = useState<Skill | null>(null);

  const handleAddNewSkill = () => {
    setSkillToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setSkillToEdit(skill);
    setIsFormOpen(true);
  };

  const handleSuccessForm = () => {
    setSkillToEdit(null);
    setIsFormOpen(false);
    mutate();
  };

  const handleCancelForm = () => {
    setSkillToEdit(null);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-editorial-ink">Kelola Skill</h1>
        
        {/* Tombol untuk memunculkan form tambah skill */}
        <button 
          onClick={handleAddNewSkill}
          className="min-h-11 rounded-md bg-editorial-action px-4 py-2 font-medium text-editorial-on-action transition hover:bg-editorial-action-hover"
        >
          + Tambah Skill
        </button>
      </div>

      {isFormOpen && (
        <SkillForm
          skillToEdit={skillToEdit}
          onCancel={handleCancelForm}
          onSuccess={handleSuccessForm}
        />
      )}

      <SkillList
        skills={skills}
        isLoading={isLoading}
        onRefresh={mutate}
        onEdit={handleEditSkill}
      />
    </div>
  );
}
