"use client";

import Navbar from "@/components/publick/layout/Navbar";
import Hero from "@/components/publick/layout/Hero";
import Footer from "@/components/publick/layout/Footer";
import PageTransition from "@/components/publick/layout/PageTransition";

export default function Home() {
  return (
    <div className="h-screen bg-gray-900 text-white font-sans flex flex-col overflow-y-auto lg:overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex flex-col justify-center">
        <PageTransition>
          <Hero />
        </PageTransition>
      </main>

      <Footer />
    </div>
  );
}