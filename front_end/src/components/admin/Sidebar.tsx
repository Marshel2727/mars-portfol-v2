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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="my-4 ml-4 flex h-[calc(100vh-32px)] w-72 flex-col rounded-3xl bg-gray-900 text-gray-100 shadow-2xl">
      <div className="border-b border-gray-800 p-6 text-center text-2xl font-bold tracking-tighter">
        PORTOFOLIO
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => {
          // ✅ BUG FIX: Mengganti == dengan === (strict equality)
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
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
