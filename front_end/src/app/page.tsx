"use client";

import useSWR from "swr";
import { getAllProjects } from "@/services/project";
import { getAllSkill } from "@/services/Skils";
import { Project, Skill } from "@/types";

// Import semua komponen Lego yang baru kita buat
import Navbar from "@/components/publick/layout/Navbar";
import Hero from "@/components/publick/layout/Hero";
import SkillsSection from "@/components/publick/SkillsSection";
import ProjectsSection from "@/components/publick/ProjectsSection";
import ContactSection from "@/components/publick/ContactSection";
import Footer from "@/components/publick/layout/Footer";

export default function Home() {
  const { data: rawProjects } = useSWR("/projects/", () => getAllProjects());
  const { data: rawSkills } = useSWR("/skills/", () => getAllSkill());

  const projects = Array.isArray(rawProjects) ? rawProjects : [];
  const skills = Array.isArray(rawSkills) ? rawSkills : [];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans scroll-smooth">
      <Navbar />
      <Hero />
      
      {/* Suapkan data ke komponen yang membutuhkan */}
      <SkillsSection skills={skills} />
      <ProjectsSection projects={projects} />
      
      <ContactSection />
      <Footer />
    </div>
  );
}