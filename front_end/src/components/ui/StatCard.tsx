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
    <div className="group relative overflow-hidden rounded-xl border border-editorial-line bg-editorial-surface p-6 shadow-[var(--shadow-editorial)] transition-all duration-300 hover:-translate-y-1 hover:border-editorial-line-strong">
      <div className="absolute left-0 top-0 h-full w-1 bg-editorial-accent transition-all duration-300 group-hover:bg-editorial-accent-strong"></div>

      <h3 className="text-sm font-semibold tracking-wider text-editorial-muted transition-colors group-hover:text-editorial-technical md:text-lg">
        {title}
      </h3>

      <p className="mt-2 text-4xl font-black text-editorial-ink">
        {isLoading ? "..." : value}
      </p>
    </div>
  );
}
