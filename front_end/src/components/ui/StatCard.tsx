// src/components/ui/StatCard.tsx

import React from "react";

// 1. Kontrak Kerja (Props)
interface StatCardProps {
  title: string;
  value: number | string; // Bisa angka, bisa juga tulisan "..." saat loading
  isLoading: boolean;
}

// 2. Karyawan Pencetak Kotak (Komponen)
export default function StatCard({ title, value, isLoading }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-teal-500/20 bg-gray-900 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-400 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)]">
      <div className="absolute left-0 top-0 h-full w-1 bg-teal-500/50 transition-all duration-300 group-hover:bg-teal-400 group-hover:shadow-[0_0_10px_rgba(45,212,191,0.8)]"></div>

      <h3 className="text-sm md:text-lg font-semibold tracking-wider text-gray-300 transition-colors group-hover:text-teal-300">
        {title}
      </h3>

      <p className="mt-2 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
        {isLoading ? "..." : value}
      </p>
    </div>
  );
}