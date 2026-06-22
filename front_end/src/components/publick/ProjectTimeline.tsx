"use client";

import { motion } from "framer-motion";
import { Project } from "@/types";
import { getImageUrl } from "@/lib/utils";

const formatProjectDate = (date?: string) => {
  if (!date) return "Project";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Project";

  return parsedDate.toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
  });
};

const sortProjectsByJourney = (projects: Project[]) => {
  return [...projects].sort((firstProject, secondProject) => {
    const firstDate = firstProject.created_at
      ? new Date(firstProject.created_at).getTime()
      : firstProject.id;
    const secondDate = secondProject.created_at
      ? new Date(secondProject.created_at).getTime()
      : secondProject.id;

    return firstDate - secondDate;
  });
};

export default function ProjectTimeline({ projects }: { projects: Project[] }) {
  const journeyProjects = sortProjectsByJourney(projects);

  return (
    <section className="border-t border-gray-800 bg-gray-950/45 py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: -12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="mb-4 inline-flex rounded-full border border-teal-500/25 bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-300"
          >
            Storyline Project
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-3xl font-extrabold text-white sm:text-4xl"
          >
            Perjalanan Karya yang Saya Bangun
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-5 text-base leading-relaxed text-gray-400 sm:text-lg"
          >
            Setiap project menjadi bagian dari proses saya dalam merancang antarmuka, membangun backend, mengolah data, dan menghubungkan solusi digital dengan kebutuhan nyata.
          </motion.p>
        </div>

        {journeyProjects.length === 0 ? (
          <p className="text-center text-gray-500">Belum ada project yang bisa ditampilkan.</p>
        ) : (
          <div className="relative mx-auto max-w-6xl">
            <div className="absolute bottom-0 left-4 top-0 w-px bg-gradient-to-b from-teal-500/0 via-teal-400/45 to-blue-500/0 md:left-1/2 md:-translate-x-1/2" />

            <div className="space-y-10 md:space-y-14">
              {journeyProjects.map((project, index) => {
                const isLeft = index % 2 === 0;
                const projectNumber = String(index + 1).padStart(2, "0");

                return (
                  <motion.article
                    key={project.id}
                    initial={{ opacity: 0, y: 34 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.55, delay: Math.min(index * 0.08, 0.32) }}
                    className="relative grid gap-6 pl-12 md:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] md:items-center md:gap-8 md:pl-0"
                  >
                    <div
                      className={`group overflow-hidden rounded-lg border border-gray-800 bg-gray-900 shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/45 hover:shadow-teal-950/25 ${
                        isLeft
                          ? "md:col-start-1 md:justify-self-end"
                          : "md:col-start-3 md:justify-self-start"
                      }`}
                    >
                      <div className="relative h-44 overflow-hidden border-b border-gray-800 sm:h-52">
                        <img
                          src={getImageUrl(project.image_url)}
                          alt={project.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-950/85 to-transparent" />
                        <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-gray-950/75 px-3 py-1 text-xs font-bold text-teal-300 backdrop-blur">
                          {formatProjectDate(project.created_at)}
                        </span>
                      </div>

                      <div className="p-6">
                        <div className="mb-3 flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-400">
                              Project {projectNumber}
                            </p>
                            <h3 className="mt-2 text-xl font-bold leading-tight text-white">
                              {project.title}
                            </h3>
                          </div>

                          {project.gallery && project.gallery.length > 0 && (
                            <span className="shrink-0 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                              {project.gallery.length} galeri
                            </span>
                          )}
                        </div>

                        <p className="line-clamp-4 text-sm leading-6 text-gray-400">
                          {project.description}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-800 pt-5">
                          {project.demo_url && (
                            <a
                              href={project.demo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-500"
                            >
                              Live Demo
                            </a>
                          )}

                          {project.github_url && (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-gray-700 px-4 py-2 text-sm font-bold text-gray-200 transition hover:border-teal-500/70 hover:text-teal-300"
                            >
                              GitHub
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="absolute left-4 top-8 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-teal-400/40 bg-gray-950 text-sm font-extrabold text-teal-300 shadow-[0_0_0_8px_rgba(15,23,42,0.9)] md:static md:col-start-2 md:row-start-1 md:h-14 md:w-14 md:translate-x-0 md:justify-self-center md:text-base">
                      {projectNumber}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
