"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { logout } from "@/services/auth";
import { useState } from "react";
import { getApiErrorMessage } from "@/services/api";

const menuItems = [
  { name: "Dashboard", path: "/admin" },
  { name: "Profil & Biodata", path: "/admin/about" },
  { name: "Konten Website", path: "/admin/content" },
  { name: "Daftar Proyek", path: "/admin/projects" },
  { name: "Keahlian & Stack", path: "/admin/skills" },
  { name: "Pesan Masuk", path: "/admin/messages" },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      onClose?.();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(getApiErrorMessage(error, "Logout gagal. Silakan coba lagi."));
    }
  };

  return (
    <aside className="my-0 ml-0 flex h-screen w-72 shrink-0 flex-col overflow-hidden rounded-none bg-editorial-inverse text-editorial-inverse-text shadow-2xl md:my-4 md:ml-4 md:h-[calc(100vh-32px)] md:rounded-3xl">
      {logoutError && <p className="p-4" role="alert">{logoutError}</p>}
      <div className="relative border-b border-editorial-inverse-text/20 p-6 text-center text-2xl font-bold tracking-tighter">
        PORTOFOLIO
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            aria-label="Tutup menu admin"
            className="absolute right-4 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-editorial-inverse-text/70 hover:text-editorial-inverse-text md:hidden"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={() => onClose?.()}
              className={`block rounded px-4 py-3 transition-colors ${
                isActive ? "bg-editorial-action font-semibold text-editorial-on-action" : "text-editorial-inverse-text/80 hover:bg-editorial-inverse-text/10 hover:text-editorial-inverse-text"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-editorial-inverse-text/20 p-4">
        <div className="mb-3 hidden md:block">
          <ThemeToggle inverse className="w-full" />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="min-h-11 w-full rounded-lg border border-editorial-inverse-text/20 bg-editorial-inverse-text/5 px-4 py-2 text-editorial-inverse-text/70 transition-all duration-300 ease-out hover:border-editorial-danger/50 hover:bg-editorial-danger/10 hover:text-editorial-danger active:scale-95"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
