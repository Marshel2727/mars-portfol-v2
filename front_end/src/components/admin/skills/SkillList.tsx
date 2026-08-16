"use client";

import { Skill } from "@/types";
import { deleteSkill } from "@/services/Skils";
import { getImageUrl } from "@/lib/utils";

// ✅ BUG FIX: Mengganti nama interface dari 'SkillFormProps' menjadi 'SkillListProps'
// (copy-paste error dari SkillForm.tsx)
interface SkillListProps {
  skills: Skill[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit: (skill: Skill) => void;
}

// ✅ DRY: Dipindahkan ke luar komponen agar tidak dibuat ulang setiap render
const getLevelColor = (level: string): string => {
  switch (level.toLowerCase()) {
    case "beginner":     return "border-editorial-line-strong bg-editorial-paper-deep text-editorial-technical";
    case "intermediate": return "border-editorial-accent/30 bg-editorial-accent/10 text-editorial-accent-strong";
    case "advanced":     return "border-editorial-technical/30 bg-editorial-technical/10 text-editorial-technical";
    case "expert":       return "border-editorial-danger/30 bg-editorial-danger/10 text-editorial-danger";
    default:               return "border-editorial-line bg-editorial-paper-deep text-editorial-muted";
  }
};

export default function SkillList({ skills, isLoading, onRefresh, onEdit }: SkillListProps) {
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin hapus skill ini?")) return;
    try {
      await deleteSkill(id);
      onRefresh();
    } catch (error) {
      console.error("Gagal hapus", error);
      alert("Gagal Menghapus Skill.");
    }
  };

  return (
    <div className="rounded-lg border border-editorial-line bg-editorial-surface p-6 shadow-[var(--shadow-editorial)]">
      <h2 className="mb-4 text-xl font-semibold text-editorial-ink">Daftar Keahlian (Skills)</h2>

      {isLoading ? (
        <p className="text-editorial-muted">Memuat data skill...</p>
      ) : skills.length === 0 ? (
        <p className="text-editorial-muted">Belum ada skill yang ditambahkan.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-editorial-ink">
            <thead className="bg-editorial-paper-deep text-xs uppercase text-editorial-muted">
              <tr>
                <th className="px-4 py-3">Ikon</th>
                <th className="px-4 py-3">Nama Skill</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Project Terkait</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id} className="border-b border-editorial-line transition hover:bg-editorial-paper-deep">
                  <td className="px-4 py-3">
                    <img
                      src={getImageUrl(skill.icon_url)}
                      alt={skill.name}
                      className="h-10 w-10 rounded object-contain bg-white p-1"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-editorial-ink">{skill.name}</td>
                  <td className="px-4 py-3 text-editorial-ink">{skill.category || "Lainnya"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded text-xs border ${getLevelColor(skill.level)}`}>
                      {skill.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-editorial-muted">
                    {skill.projects?.length ? `${skill.projects.length} project` : "Belum ditautkan"}
                  </td>
                  <td className="px-4 py-3 text-center space-x-4">
                    <button
                      onClick={() => onEdit(skill)}
                      className="font-medium text-editorial-technical transition hover:text-editorial-accent-strong"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(skill.id)}
                      className="font-medium text-editorial-danger transition hover:text-editorial-accent-strong"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
