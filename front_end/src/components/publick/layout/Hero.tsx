"use client"; // Wajib karena framer-motion butuh akses ke browser API

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  const focusAreas = [
    "Full-Stack Web Development",
    "REST API & Dashboard",
    "Internet of Things",
  ];

  return (
    <main id="about" className="flex flex-col items-center justify-center px-8 text-center py-10 md:py-0 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-block px-4 py-1.5 mb-6 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-sm font-semibold tracking-wide"
      >
        Portfolio Full-Stack Developer & IoT Enthusiast
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white"
      >
        Halo, Saya <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Marshel</span>
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="text-base md:text-xl text-gray-300 max-w-3xl mb-6 leading-relaxed"
      >
        Saya adalah mahasiswa Teknik Komputer yang berfokus pada pengembangan aplikasi web end-to-end, mulai dari antarmuka yang nyaman digunakan, API yang terstruktur, hingga integrasi teknologi IoT. Saya membangun solusi digital yang fungsional, efisien, dan siap dikembangkan sesuai kebutuhan nyata.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="mb-10 flex flex-wrap justify-center gap-3 text-sm font-semibold text-gray-300"
      >
        {focusAreas.map((area) => (
          <span
            key={area}
            className="rounded-full border border-gray-700 bg-gray-800/70 px-4 py-2"
          >
            {area}
          </span>
        ))}
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Link href="/projects" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg shadow-teal-500/30 hover:scale-105">
          Lihat Karya Saya
        </Link>
        <Link href="/contact" className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 border border-gray-700 hover:scale-105">
          Hubungi Saya
        </Link>
      </motion.div>

    </main>
  );
}
