"use client";

import { useState, useEffect } from "react";
import { getAllProjects } from "@/services/project";
import { getAllSkill } from "@/services/Skils";
import { Project,Skill } from "@/types";

// Import semua komponen Lego yang baru kita buat
import Navbar from "@/components/publick/layout/Navbar";
import Hero from "@/components/publick/layout/Hero";
import SkillsSection from "@/components/publick/SkillsSection";
import ProjectsSection from "@/components/publick/ProjectsSection";
import ContactSection from "@/components/publick/ContactSection";
import Footer from "@/components/publick/layout/Footer";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsData = await getAllProjects();
        const skillsData = await getAllSkill();
        setProjects(projectsData);
        setSkills(skillsData);
      } catch (error) {
        console.error("Gagal mengambil data portofolio:", error);
      }
    };
    fetchData();
  }, []);

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