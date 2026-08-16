"use client";

import { useState } from "react";
import useSWR from "swr";
import { getAllProjects } from "@/services/project";
import { Project } from "@/types";
import ProjectForm from "@/components/admin/projects/ProjectForm";
import ProjectList from "@/components/admin/projects/ProjectList";

export default function ProjectAdminPage() {
  const { data: rawProjects, isLoading, mutate } = useSWR("/projects/", () => getAllProjects());
  const projects = Array.isArray(rawProjects) ? rawProjects : [];

  // Saklar untuk mengontrol apakah modal form terbuka atau tertutup
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const handleSuccessForm = () => {
    setProjectToEdit(null);
    setIsFormOpen(false); // Tutup form setelah berhasil simpan
    mutate();
  };

  const handleCancelForm = () => {
    setProjectToEdit(null);
    setIsFormOpen(false); // Tutup form saat klik batal
  };

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setIsFormOpen(true); // Buka form saat tombol edit diklik
  };

  const handleAddNewProject = () => {
    setProjectToEdit(null); // Pastikan form kosong
    setIsFormOpen(true); // Buka form untuk tambah baru
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-editorial-ink">Kelola Project</h1>
        
        {/* Tombol untuk memunculkan form tambah proyek */}
        <button 
          onClick={handleAddNewProject}
          className="min-h-11 rounded-md bg-editorial-action px-4 py-2 font-medium text-editorial-on-action transition hover:bg-editorial-action-hover"
        >
          + Tambah Proyek
        </button>
      </div>

      {/* Form hanya akan muncul jika isFormOpen bernilai true */}
      {isFormOpen && (
        <ProjectForm
          projectToEdit={projectToEdit}
          onSuccess={handleSuccessForm}
          onCancel={handleCancelForm}
        />
      )}

      <ProjectList
        projects={projects}
        isLoading={isLoading}
        onRefresh={mutate}
        onEdit={handleEditProject}
      />
    </div>
  );
}
