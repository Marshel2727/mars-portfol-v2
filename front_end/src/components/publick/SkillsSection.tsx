"use client";

import { Skill } from "../../types";
import { motion } from "framer-motion";

// Helper function to map skill level to a segmented value (1 to 4)
const getSkillLevelValue = (level: string): number => {
  switch (level?.toLowerCase()) {
    case "beginner":
      return 1;
    case "intermediate":
      return 2;
    case "advanced":
      return 3;
    case "expert":
      return 4;
    default:
      return 2;
  }
};

// Helper function to get premium styling for skill level badges
const getLevelBadgeStyles = (level: string): string => {
  switch (level?.toLowerCase()) {
    case "beginner":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "intermediate":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "advanced":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "expert":
      return "bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse";
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
};

export default function SkillsSection({ skills }: { skills: Skill[] }) {
  return (
    <section id="skills" className="py-24 bg-gray-800/50 border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-8">
        
        {/* Animasi Judul */}
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-extrabold mb-4 text-center text-white"
        >
          Teknologi & Keahlian
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-400 text-center max-w-2xl mx-auto mb-16 text-lg"
        >
          Daftar bahasa pemrograman, framework, dan teknologi yang saya kuasai beserta tingkat kemahirannya.
        </motion.p>

        {skills.length === 0 ? (
          <p className="text-center text-gray-500">Belum ada skill yang ditambahkan.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-center">
            {skills.map((skill, index) => (
              <motion.div 
                key={skill.id}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="flex flex-col items-center p-6 bg-gray-950/40 rounded-2xl border border-gray-800 hover:border-teal-500/50 transition-all duration-300 group shadow-lg hover:shadow-[0_10px_30px_rgba(20,184,166,0.05)] hover:-translate-y-1.5"
              >
                {/* Icon Container */}
                <div className="h-16 w-16 flex items-center justify-center bg-white p-2.5 rounded-2xl shadow-inner mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_BASE_URL}${skill.icon_url}`} 
                    alt={skill.name} 
                    className="h-full w-full object-contain" 
                  />
                </div>
                
                {/* Skill Name */}
                <span className="font-bold text-white text-base group-hover:text-teal-400 transition-colors text-center truncate w-full">
                  {skill.name}
                </span>

                {/* Segmented Level Indicator Blocks */}
                <div className="flex gap-1.5 mt-4 mb-3">
                  {[1, 2, 3, 4].map((step) => {
                    const isFilled = step <= getSkillLevelValue(skill.level);
                    return (
                      <span
                        key={step}
                        className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                          isFilled 
                            ? "bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_8px_rgba(20,184,166,0.3)]" 
                            : "bg-gray-800"
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Highly Prominent Badge */}
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full border mt-1 shadow-sm transition-all duration-300 group-hover:scale-105 ${getLevelBadgeStyles(skill.level)}`}>
                  {skill.level}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}