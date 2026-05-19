"use client";

import { useState, useEffect } from "react";
import { getAllProjects } from "@/services/project";
import { Project } from "@/types";
import ProjectForm from "@/components/admin/projects/ProjectForm";
import ProjectList from "@/components/admin/projects/ProjectList";

export default function ProjectAdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Saklar untuk mengontrol apakah modal form terbuka atau tertutup
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error("Gagal memuat project", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSuccessForm = () => {
    setProjectToEdit(null);
    setIsFormOpen(false); // Tutup form setelah berhasil simpan
    loadProjects();
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
        <h1 className="text-3xl font-bold text-white">Kelola Project</h1>
        
        {/* Tombol untuk memunculkan form tambah proyek */}
        <button 
          onClick={handleAddNewProject}
          className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-md font-medium transition"
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
        onRefresh={loadProjects}
        onEdit={handleEditProject}
      />
    </div>
  );
}