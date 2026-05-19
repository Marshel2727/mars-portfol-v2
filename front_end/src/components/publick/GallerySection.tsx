"use client";

import { useEffect, useState } from "react";
import { Project } from "@/types";
import { getAllProjects } from "@/services/project";
import Link from "next/link";
import { motion } from "framer-motion";
// ✅ DRY: Mengimpor getImageUrl dari lib/utils.ts, menghapus definisi lokal
import { getImageUrl } from "@/lib/utils";

export default function GallerySection({ projectId }: { projectId: number }) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const allProjects = await getAllProjects();
        const foundProject = allProjects.find((p) => p.id === projectId);
        setProject(foundProject || null);
      } catch (error) {
        console.error("Gagal mengambil data proyek:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        const el = document.getElementById(`lightbox-item-${lightboxIndex}`);
        if (el) el.scrollIntoView({ behavior: "instant" });
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    }
  }, [lightboxIndex]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-teal-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Proyek tidak ditemukan</h2>
        <Link href="/#projects" className="text-teal-400 hover:underline">&larr; Kembali ke Beranda</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 pt-24 pb-12 px-6 sm:px-12">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/#projects"
          className="inline-flex items-center text-gray-400 hover:text-teal-400 transition-colors mb-8 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar Proyek
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Galeri:{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
              {project.title}
            </span>
          </h1>
          <p className="text-gray-400 max-w-3xl text-lg leading-relaxed">
            Kumpulan tangkapan layar dan dokumentasi visual untuk proyek ini.
          </p>
        </div>

        {project.gallery && project.gallery.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.gallery.map((img, index) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => setLightboxIndex(index)}
                className="group relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-800 shadow-xl cursor-pointer"
              >
                <img
                  src={getImageUrl(img.image_url)}
                  alt={img.caption || project.title}
                  className="w-full h-64 md:h-80 object-contain bg-gray-900 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
                {img.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent p-6 pt-12">
                    <p className="text-gray-200 font-medium translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      {img.caption}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500 border border-dashed border-gray-700 rounded-2xl">
            Belum ada foto di galeri ini.
          </div>
        )}
      </div>

      {lightboxIndex !== null && project.gallery && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col">
          <div className="absolute top-0 inset-x-0 p-4 md:p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div className="flex items-center gap-2 text-teal-400 animate-pulse">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
              <span className="text-sm font-medium tracking-wide">Geser Atas / Bawah</span>
            </div>
            <button
              onClick={() => setLightboxIndex(null)}
              className="text-gray-400 hover:text-white bg-white/10 hover:bg-red-500 rounded-full p-2 transition-all pointer-events-auto"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth custom-scrollbar cursor-pointer"
            onClick={() => setLightboxIndex(null)}
          >
            {project.gallery.map((img, i) => (
              <div
                key={img.id}
                id={`lightbox-item-${i}`}
                className="h-screen w-full snap-start snap-always flex flex-col items-center justify-center p-4 md:p-12 relative"
              >
                <img
                  src={getImageUrl(img.image_url)}
                  alt={img.caption || project.title}
                  onClick={(e) => e.stopPropagation()}
                  className="max-h-[85vh] max-w-full object-contain drop-shadow-[0_0_30px_rgba(45,212,191,0.15)] cursor-default"
                />
                {img.caption && (
                  <div
                    className="absolute bottom-8 md:bottom-12 inset-x-0 text-center px-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="inline-block bg-gray-900/80 backdrop-blur-md text-gray-200 px-6 py-2.5 rounded-full text-sm md:text-base border border-gray-700/50 shadow-2xl">
                      {img.caption}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
