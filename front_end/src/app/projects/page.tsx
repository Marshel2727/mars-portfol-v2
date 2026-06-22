"use client";

import useSWR from "swr";
import { getAllProjects } from "@/services/project";
import { getAllSkill } from "@/services/Skils";
import Navbar from "@/components/publick/layout/Navbar";
import SkillsSection from "@/components/publick/SkillsSection";
import ProjectTimeline from "@/components/publick/ProjectTimeline";
import ProjectsSection from "@/components/publick/ProjectsSection";
import Footer from "@/components/publick/layout/Footer";
import PageTransition from "@/components/publick/layout/PageTransition";

export default function ProjectsPage() {
  const { data: rawProjects } = useSWR("/projects/", () => getAllProjects());
  const { data: rawSkills } = useSWR("/skills/", () => getAllSkill());

  const projects = Array.isArray(rawProjects) ? rawProjects : [];
  const skills = Array.isArray(rawSkills) ? rawSkills : [];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Navbar />
      
      <main className="pt-20 flex-1">
        <PageTransition>
          <SkillsSection skills={skills} />
          <ProjectTimeline projects={projects} />
          <ProjectsSection projects={projects} />
        </PageTransition>
      </main>

      <Footer />
    </div>
  );
}
