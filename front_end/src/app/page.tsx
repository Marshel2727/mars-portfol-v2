"use client";

import useSWR from "swr";
import { getAllProjects } from "@/services/project";
import Navbar from "@/components/publick/layout/Navbar";
import Hero from "@/components/publick/layout/Hero";
import ProjectTimeline from "@/components/publick/ProjectTimeline";
import Footer from "@/components/publick/layout/Footer";
import PageTransition from "@/components/publick/layout/PageTransition";
import AboutSection from "@/components/publick/AboutSection";
import WorkProcessSection from "@/components/publick/WorkProcessSection";
import AboutCta from "@/components/publick/AboutCta";
import { getAboutProfile } from "@/services/about";

export default function Home() {
  const { data: rawProjects } = useSWR("/projects/", () => getAllProjects());
  const { data: aboutProfile } = useSWR("/about/", () => getAboutProfile());
  const projects = Array.isArray(rawProjects) ? rawProjects : [];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <PageTransition>
          <section className="flex min-h-[calc(100vh-5rem)] flex-col justify-center">
            <Hero />
          </section>
          <AboutSection profile={aboutProfile} />
          <WorkProcessSection />
          <ProjectTimeline projects={projects} />
          <AboutCta profile={aboutProfile} />
        </PageTransition>
      </main>

      <Footer />
    </div>
  );
}
