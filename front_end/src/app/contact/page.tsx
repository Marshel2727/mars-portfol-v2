"use client";

import Navbar from "@/components/publick/layout/Navbar";
import ContactSection from "@/components/publick/ContactSection";
import Footer from "@/components/publick/layout/Footer";
import PageTransition from "@/components/publick/layout/PageTransition";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Navbar />

      <main className="pt-20 flex-1 flex flex-col justify-center">
        <PageTransition>
          <ContactSection />
        </PageTransition>
      </main>

      <Footer />
    </div>
  );
}
