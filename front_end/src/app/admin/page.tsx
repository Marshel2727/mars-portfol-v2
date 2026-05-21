"use client";

import useSWR from "swr";
import { getAllProjects } from "@/services/project";
import { getAllSkill } from "@/services/Skils";
import { getAllMessages } from "@/services/messages";
import StatCard from "@/components/ui/StatCard";

export default function AdminDashboard() {
  const { data: rawProjects, isLoading: loadingProjects } = useSWR("/projects/", () => getAllProjects());
  const { data: rawSkills, isLoading: loadingSkills } = useSWR("/skills/", () => getAllSkill());
  const { data: rawMessages, isLoading: loadingMessages } = useSWR("/messages/", () => getAllMessages());

  const projects = Array.isArray(rawProjects) ? rawProjects : [];
  const skills = Array.isArray(rawSkills) ? rawSkills : [];
  const messages = Array.isArray(rawMessages) ? rawMessages : [];

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