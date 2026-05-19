"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Project } from "@/types";
import Link from "next/link";
// ✅ DRY: Mengimpor getImageUrl dari lib/utils.ts, menghapus definisi lokal
import { getImageUrl } from "@/lib/utils";

export default function ProjectsSection({ projects }: { projects: Project[] }) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section id="projects" className="py-24 max-w-7xl mx-auto px-8 relative">
      <h2 className="text-3xl font-bold mb-12 text-center text-white">Proyek Terbaru</h2>

      {projects.length === 0 ? (
        <p className="text-center text-gray-500">Belum ada proyek yang ditambahkan.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-teal-500/50 transition flex flex-col group"
            >
              <div className="overflow-hidden">
                <img
                  src={getImageUrl(project.image_url)}
                  alt={project.title}
                  className="w-full h-48 object-cover border-b border-gray-700 transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">
                  {project.title}
                </h3>
                <p className="text-gray-400 text-sm mb-6 flex-1 line-clamp-3">{project.description}</p>

                <div className="mt-auto pt-4 border-t border-gray-700/50 flex items-center justify-between">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedProject(project); }}
                    className="text-teal-500 hover:text-teal-400 text-sm font-semibold transition-colors flex items-center gap-1 group-hover:underline"
                  >
                    Lihat Detail &rarr;
                  </button>

                  {project.gallery && project.gallery.length > 0 && (
                    <Link
                      href={`/gallery/${project.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Galeri ({project.gallery.length})
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedProject(null)}
          />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-red-500 rounded-full p-2 transition backdrop-blur-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <img
              src={getImageUrl(selectedProject.image_url)}
              alt={selectedProject.title}
              className="w-full h-64 sm:h-80 object-cover border-b border-gray-800"
            />

            <div className="p-6 sm:p-8 overflow-y-auto flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{selectedProject.title}</h2>
              <p className="text-gray-300 leading-relaxed mb-8 whitespace-pre-wrap">{selectedProject.description}</p>

              <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                {selectedProject.demo_url && (
                  <a
                    href={selectedProject.demo_url} target="_blank" rel="noreferrer"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-center py-3 rounded-lg font-semibold transition shadow-lg shadow-teal-500/20"
                  >
                    Kunjungi Live Demo
                  </a>
                )}
                {selectedProject.github_url && (
                  <a
                    href={selectedProject.github_url} target="_blank" rel="noreferrer"
                    className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-center py-3 rounded-lg font-semibold transition"
                  >
                    Lihat Kode di GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
