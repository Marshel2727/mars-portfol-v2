"use client";

import { useState } from "react";
import { Project } from "@/types";
import { deleteProject } from "@/services/project";
import ProjectGalleryModal from "./ProjectGalleryModal";

interface ProjectListProps {
  projects: Project[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit: (project: Project) => void;
}

export default function ProjectList({ projects, isLoading, onRefresh, onEdit }: ProjectListProps) {
  const [activeGallery, setActiveGallery] = useState<Project | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin hapus project ini?")) return;
    try {
      await deleteProject(id);
      onRefresh();
    } catch (error) {
      console.error("Gagal Hapus", error);
      alert("Gagal Menghapus Project.");
    }
  };

  return (
    <div className="rounded-lg bg-gray-800 p-6 shadow-md border border-gray-700">
      
      {/* --- HEADER TABEL: Judul Kiri, Tombol Kanan --- */}
      <div className="mb-6 flex items-center justify-between border-b border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-white">DAFTAR PROJECT</h2>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-400">Memuat data proyek...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 py-12 text-center text-gray-400 bg-gray-900/50">
          Belum ada proyek yang ditambahkan.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-700/50 text-xs uppercase text-gray-400 border-b border-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Gambar</th>
                <th className="px-4 py-3 font-semibold">Judul</th>
                <th className="px-4 py-3 font-semibold">Deskripsi</th>
                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {projects.map((project) => (
                <tr key={project.id} className="transition-colors hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}${project.image_url}`} 
                      alt={project.title}
                      className="h-12 w-12 rounded object-cover shadow-sm border border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{project.title}</td>
                  <td className="px-4 py-3">
                    <div className="line-clamp-2 max-w-xs text-sm text-gray-300 font-normal">
                      {project.description}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      
                      {/* Tombol Galeri */}
                      <button
                        onClick={() => setActiveGallery(project)}
                        className="flex items-center gap-1.5 rounded-md border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-400 transition-colors hover:bg-teal-500 hover:text-white shadow-sm"
                        title="Kelola Galeri"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Galeri
                      </button>

                      {/* Tombol Edit */}
                      <button
                        onClick={() => onEdit(project)}
                        className="flex items-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500 hover:text-white shadow-sm"
                        title="Edit Proyek"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>

                      {/* Tombol Hapus */}
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500 hover:text-white shadow-sm"
                        title="Hapus Proyek"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAMPILKAN MODAL GALERI */}
      {activeGallery && (
        <ProjectGalleryModal 
          project={activeGallery} 
          onClose={() => setActiveGallery(null)} 
          onRefresh={onRefresh} 
        />
      )}

    </div>
  );
}