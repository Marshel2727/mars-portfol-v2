"use client";

import useSWR from "swr";
import { getAllProjects } from "@/services/project";
import Navbar from "@/components/publick/layout/Navbar";
import Hero from "@/components/publick/layout/Hero";
import ProjectTimeline from "@/components/publick/ProjectTimeline";
import Footer from "@/components/publick/layout/Footer";
import PageTransition from "@/components/publick/layout/PageTransition";

export default function Home() {
  const { data: rawProjects } = useSWR("/projects/", () => getAllProjects());
  const projects = Array.isArray(rawProjects) ? rawProjects : [];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <PageTransition>
          <section className="flex min-h-[calc(100vh-5rem)] flex-col justify-center">
            <Hero />
          </section>
          <ProjectTimeline projects={projects} />
        </PageTransition>
      </main>

      <Footer />
    </div>
  );
}
