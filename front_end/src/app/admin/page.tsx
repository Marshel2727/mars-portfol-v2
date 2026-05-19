"use client";

import { useState, useEffect } from "react";
import { getAllProjects } from "@/services/project";
import { getAllSkill } from "@/services/Skils";
import { getAllMessages } from "@/services/messages";
import StatCard from "@/components/ui/StatCard";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    projects: 0,
    skills: 0,
    messages: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats(){
      try{
        setIsLoading(true);
        const [projects, skills, messages] = await Promise.all([
          getAllProjects(),
          getAllSkill(),
          getAllMessages(),
        ]);

        setStats({
          projects: projects.length,
          skills: skills.length,
          messages: messages.length,
        });
      } catch (error) {
        console.error('Gagal mengambil statistik', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-gray-100 text-center">Dashboard Overview</h1>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="Total Proyek" value={stats.projects} isLoading={isLoading} />
        <StatCard title="Total Skill" value={stats.skills} isLoading={isLoading} />
        <StatCard title="Pesan Masuk" value={stats.messages} isLoading={isLoading} />
      </div>
    </div>
  );
  
}