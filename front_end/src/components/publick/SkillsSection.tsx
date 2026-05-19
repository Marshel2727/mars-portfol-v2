"use client";

import { Skill } from "../../types";
import { motion } from "framer-motion"; // Tambahkan import ini

export default function SkillsSection({ skills }: { skills: Skill[] }) {
  return (
    <section id="skills" className="py-20 bg-gray-800/50 border-y border-gray-800 overflow-hidden">
      <div className="max-w-5xl mx-auto px-8">
        
        {/* Animasi Judul */}
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} // Animasi hanya jalan sekali saat pertama dilihat
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold mb-12 text-center"
        >
          Teknologi & Keahlian
        </motion.h2>

        {skills.length === 0 ? (
          <p className="text-center text-gray-500">Belum ada skill yang ditambahkan.</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {skills.map((skill, index) => (
              // Ubah div menjadi motion.div
              <motion.div 
                key={skill.id}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }} // Efek muncul bergantian (stagger)
                className="flex flex-col items-center p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-teal-500/50 transition group min-w-[120px]"
              >
                <img 
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}${skill.icon_url}`} 
                  alt={skill.name} 
                  className="h-12 w-12 object-contain mb-3 group-hover:scale-110 transition bg-white p-1 rounded" 
                />
                <span className="font-medium text-gray-300 group-hover:text-teal-400 transition">{skill.name}</span>
                <span className="text-xs text-gray-500 mt-1">{skill.level}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}