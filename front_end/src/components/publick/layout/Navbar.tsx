"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

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
      <div className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-teal-400 hover:scale-105 transition-transform duration-200">
          marsPorto.
        </Link>
        <div className="flex space-x-8 text-sm font-semibold">
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
      </div>
    </nav>
  );
}