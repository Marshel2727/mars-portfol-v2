"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Project } from "@/types";
import Link from "next/link";
// ✅ DRY: Mengimpor getImageUrl dari lib/utils.ts, menghapus definisi lokal
import { getImageUrl } from "@/lib/utils";

const renderProjectDescription = (description: string) => {
  const blocks = description
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const isBullet = /^(?:\u2022|-)\s+/.test(block);
    const content = block.replace(/^(?:\u2022|-)\s+/, "");
    const isHeading = !isBullet && block.endsWith(":") && block.length < 100;

    if (isHeading) {
      return (
        <h4 key={`${index}-${block}`} className="pt-2 text-base font-bold text-white">
          {block.slice(0, -1)}
        </h4>
      );
    }

    if (isBullet) {
      return (
        <div key={`${index}-${content}`} className="flex items-start gap-3 text-gray-300">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
          <p className="min-w-0 text-base leading-7">{content}</p>
        </div>
      );
    }

    return (
      <p key={`${index}-${block}`} className="whitespace-pre-line text-base leading-7 text-gray-300">
        {block}
      </p>
    );
  });
};

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
              <div className="relative overflow-hidden">
                <img
                  src={getImageUrl(project.image_url)}
                  alt={project.title}
                  className="w-full h-48 object-cover border-b border-gray-700 transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 rounded bg-gray-950/90 px-2.5 py-1 text-xs font-semibold text-teal-300 backdrop-blur-sm">
                  {project.category || "Lainnya"}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">
                  {project.title}
                </h3>
                {project.tech_tags?.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {project.tech_tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
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
          <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-2xl animate-in fade-in zoom-in duration-200">
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-800 px-5 py-4 sm:px-7">
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold uppercase text-teal-400">Detail Project</p>
                <h2 className="break-words text-xl font-bold text-white sm:text-2xl">{selectedProject.title}</h2>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="shrink-0 rounded-full p-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label="Tutup"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
              <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:gap-9">
                <aside className="space-y-6 lg:sticky lg:top-0">
                  <img
                    src={getImageUrl(selectedProject.image_url)}
                    alt={selectedProject.title}
                    className="aspect-video w-full rounded-lg border border-gray-800 object-cover lg:aspect-[4/3]"
                  />

                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase text-gray-500">Kategori & Teknologi</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-300 ring-1 ring-inset ring-teal-500/30">
                        {selectedProject.category || "Lainnya"}
                      </span>
                      {selectedProject.tech_tags?.map((tag) => (
                        <span key={tag} className="rounded border border-gray-700 px-2.5 py-1 text-xs text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedProject.skills && selectedProject.skills.length > 0 && (
                    <div className="border-t border-gray-800 pt-5">
                      <h3 className="mb-3 text-xs font-semibold uppercase text-gray-500">Skill yang Digunakan</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.skills.map((skill) => (
                          <span key={skill.id} className="rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-200">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </aside>

                <article className="min-w-0 border-t border-gray-800 pt-7 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0">
                  <h3 className="mb-5 text-lg font-bold text-white">Tentang Project</h3>
                  <div className="max-w-3xl space-y-5">
                    {renderProjectDescription(selectedProject.description)}
                  </div>
                </article>
              </div>
            </div>

            {(selectedProject.demo_url || selectedProject.github_url) && (
              <footer className="flex shrink-0 flex-col justify-end gap-3 border-t border-gray-800 bg-gray-900 px-5 py-4 sm:flex-row sm:px-7">
                {selectedProject.github_url && (
                  <a
                    href={selectedProject.github_url} target="_blank" rel="noreferrer"
                    className="rounded-lg border border-gray-600 bg-gray-800 px-6 py-3 text-center font-semibold text-white transition hover:bg-gray-700 sm:min-w-48"
                  >
                    Lihat Kode di GitHub
                  </a>
                )}
                {selectedProject.demo_url && (
                  <a
                    href={selectedProject.demo_url} target="_blank" rel="noreferrer"
                    className="rounded-lg bg-teal-600 px-6 py-3 text-center font-semibold text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-700 sm:min-w-48"
                  >
                    Kunjungi Live Demo
                  </a>
                )}
              </footer>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
