"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/services/auth";

const menuItems = [
  { name: "DashBoard", path: "/admin" },
  { name: "Projects", path: "/admin/projects" },
  { name: "Skills", path: "/admin/skills" },
  { name: "Message", path: "/admin/messages" },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    onClose?.();
    router.push("/login");
  };

  return (
    <aside className="my-0 ml-0 md:my-4 md:ml-4 flex h-screen md:h-[calc(100vh-32px)] w-72 shrink-0 flex-col bg-gray-900 text-gray-100 shadow-2xl rounded-none md:rounded-3xl">
      <div className="border-b border-gray-800 p-6 text-center text-2xl font-bold tracking-tighter relative">
        PORTOFOLIO
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden p-2 text-gray-400 hover:text-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={() => onClose?.()}
              className={`block rounded px-4 py-3 transition-colors ${
                isActive ? "bg-teal-600 font-semibold" : "hover:bg-gray-800"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-700/50 p-4">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-gray-700 bg-gray-800/30 px-4 py-2 text-gray-400 transition-all duration-300 ease-out hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] active:scale-95"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
