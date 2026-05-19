"use client";

import { Skill } from "@/types";
import { deleteSkill } from "@/services/Skils";

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
    case "beginner":     return "bg-blue-900 text-blue-200 border-blue-700";
    case "intermediate": return "bg-yellow-900 text-yellow-200 border-yellow-700";
    case "advanced":     return "bg-orange-900 text-orange-200 border-orange-700";
    case "expert":       return "bg-red-900 text-red-200 border-red-700";
    default:             return "bg-gray-700 text-gray-300";
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
    <div className="rounded-lg bg-gray-800 p-6 shadow-md border border-gray-700">
      <h2 className="mb-4 text-xl font-semibold text-white">Daftar Keahlian (Skills)</h2>

      {isLoading ? (
        <p className="text-gray-400">Memuat data skill...</p>
      ) : skills.length === 0 ? (
        <p className="text-gray-400">Belum ada skill yang ditambahkan.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-700 text-xs uppercase text-gray-400">
              <tr>
                <th className="px-4 py-3">Ikon</th>
                <th className="px-4 py-3">Nama Skill</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id} className="border-b border-gray-700 hover:bg-gray-750 transition">
                  <td className="px-4 py-3">
                    <img
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}${skill.icon_url}`}
                      alt={skill.name}
                      className="h-10 w-10 rounded object-contain bg-white p-1"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{skill.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded text-xs border ${getLevelColor(skill.level)}`}>
                      {skill.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center space-x-4">
                    <button
                      onClick={() => onEdit(skill)}
                      className="text-blue-400 hover:text-blue-300 transition font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(skill.id)}
                      className="text-red-500 hover:text-red-400 transition font-medium"
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
