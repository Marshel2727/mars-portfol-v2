"use client";

import { Skill } from "../../types";
import { motion } from "framer-motion";
import { getImageUrl } from "@/lib/utils";

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
  const groupedSkills = skills.reduce<Record<string, Skill[]>>((groups, skill) => {
    const category = skill.category?.trim() || "Lainnya";
    groups[category] = [...(groups[category] || []), skill];
    return groups;
  }, {});

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
          <div className="space-y-14">
            {Object.entries(groupedSkills).map(([category, categorySkills], categoryIndex) => (
              <div key={category}>
                <div className="mb-6 flex items-center gap-4">
                  <h3 className="text-xl font-bold text-white">{category}</h3>
                  <span className="rounded bg-gray-900 px-2 py-1 text-xs font-semibold text-gray-400">
                    {categorySkills.length} skill
                  </span>
                  <span className="h-px flex-1 bg-gray-700" />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {categorySkills.map((skill, index) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: (categoryIndex + index) * 0.04 }}
                      className="flex min-h-48 flex-col rounded-lg border border-gray-800 bg-gray-950/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/50"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white p-2 shadow-inner">
                          <img
                            src={getImageUrl(skill.icon_url)}
                            alt={skill.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-base font-bold text-white">{skill.name}</span>
                          <span className={`mt-2 inline-block rounded border px-2.5 py-1 text-xs font-bold ${getLevelBadgeStyles(skill.level)}`}>
                            {skill.level}
                          </span>
                        </div>
                      </div>

                      <div className="my-4 flex gap-1.5" aria-label={`Level ${skill.level}`}>
                        {[1, 2, 3, 4].map((step) => (
                          <span
                            key={step}
                            className={`h-1.5 flex-1 rounded-full ${
                              step <= getSkillLevelValue(skill.level) ? "bg-teal-500" : "bg-gray-800"
                            }`}
                          />
                        ))}
                      </div>

                      <div className="mt-auto border-t border-gray-800 pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Digunakan pada project</p>
                        {skill.projects && skill.projects.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {skill.projects.map((project) => (
                              <a
                                key={project.id}
                                href="#projects"
                                className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-teal-500/15 hover:text-teal-300"
                              >
                                {project.title}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">Belum ditautkan.</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
