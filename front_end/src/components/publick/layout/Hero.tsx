"use client"; // Wajib karena framer-motion butuh akses ke browser API

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <main id="about" className="flex flex-col items-center justify-center px-8 text-center py-10 md:py-0 overflow-hidden">
      
      {/* Animasi Label Muncul dari atas */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-block px-4 py-1.5 mb-6 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-sm font-semibold tracking-wide"
      >
        Selamat datang di ruang digital saya
      </motion.div>
      
      {/* Animasi Nama Muncul dari bawah dengan delay */}
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white"
      >
        Halo, Saya <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Marshel</span>
      </motion.h1>
      
      {/* Animasi Deskripsi Fade In */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed"
      >
        Seorang mahasiswa Teknik Komputer yang antusias mengeksplorasi dunia Full-Stack Web Development dan Internet of Things (IoT). Saya senang membangun solusi digital yang interaktif dan efisien.
      </motion.p>
      
      {/* Animasi Tombol Zoom In */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
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