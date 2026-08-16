"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-editorial-paper text-editorial-ink md:flex-row">
      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-editorial-inverse-text/20 bg-editorial-inverse p-4 text-editorial-inverse-text shadow-md md:hidden">
        <span className="font-bold tracking-tighter text-xl">PORTOFOLIO</span>
        <div className="flex items-center gap-2">
          <ThemeToggle inverse />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Tutup menu admin" : "Buka menu admin"}
            aria-expanded={isOpen}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-editorial-inverse-text/70 transition hover:bg-editorial-inverse-text/10 hover:text-editorial-inverse-text focus:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar - Always visible on desktop, drawer on mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:sticky md:top-0 md:h-screen md:self-start md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setIsOpen(false)} />
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-editorial-overlay backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
