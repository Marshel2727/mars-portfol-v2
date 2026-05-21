"use client";

import useSWR from "swr";
import { getAllProjects } from "@/services/project";
import { getAllSkill } from "@/services/Skils";
import { getAllMessages } from "@/services/messages";
import StatCard from "@/components/ui/StatCard";

export default function AdminDashboard() {
  const { data: projects = [], isLoading: loadingProjects } = useSWR("admin/projects", getAllProjects);
  const { data: skills = [], isLoading: loadingSkills } = useSWR("admin/skills", getAllSkill);
  const { data: messages = [], isLoading: loadingMessages } = useSWR("admin/messages", getAllMessages);

  const isLoading = loadingProjects || loadingSkills || loadingMessages;

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-gray-100 text-center">Dashboard Overview</h1>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="Total Proyek" value={projects.length} isLoading={isLoading} />
        <StatCard title="Total Skill" value={skills.length} isLoading={isLoading} />
        <StatCard title="Pesan Masuk" value={messages.length} isLoading={isLoading} />
      </div>
    </div>
  );
}