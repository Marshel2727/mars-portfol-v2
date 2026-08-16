"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const isOpen = openPath === pathname;

  const isLinkActive = (path: string) => {
    return pathname === path;
  };

  const navLinks = [
    { label: "About", path: "/" },
    { label: "Projects & Skills", path: "/projects" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800/80 shadow-md">
      <div className="flex items-center justify-between px-6 sm:px-8 py-5 max-w-7xl mx-auto">
        <Link 
          href="/" 
          onClick={() => setOpenPath(null)}
          className="text-2xl font-bold tracking-tighter text-teal-400 hover:scale-105 transition-transform duration-200"
        >
          marsPorto.
        </Link>
        
        {/* Desktop Navigation Links */}
        <div className="hidden md:flex space-x-8 text-sm font-semibold">
          {navLinks.map((link) => {
            const active = isLinkActive(link.path);
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`transition-all duration-300 pb-1 border-b-2 ${
                  active
                    ? "text-teal-400 border-teal-500/80 shadow-[0_4px_12px_rgba(20,184,166,0.15)] font-bold"
                    : "text-gray-300 hover:text-teal-400 border-transparent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setOpenPath(isOpen ? null : pathname)}
          className="md:hidden p-2 text-gray-400 hover:text-teal-400 focus:outline-none transition-colors duration-200"
          aria-label="Toggle Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden absolute inset-x-0 top-[73px] bg-gray-950/98 backdrop-blur-xl border-b border-gray-800 shadow-2xl py-6 px-6 z-40 transition-all duration-300 animate-in fade-in slide-in-from-top-5">
          <div className="flex flex-col space-y-4 text-base font-semibold">
            {navLinks.map((link) => {
              const active = isLinkActive(link.path);
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setOpenPath(null)}
                  className={`transition-all duration-200 py-3 px-5 rounded-xl border-l-4 ${
                    active
                      ? "text-teal-400 border-teal-500 bg-teal-500/5 shadow-[inset_4px_0_12px_rgba(20,184,166,0.1)] font-bold"
                      : "text-gray-300 hover:text-teal-400 border-transparent hover:bg-gray-800/40"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
