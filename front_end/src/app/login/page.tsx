"use client"; // Wajib ditambahkan jika halaman menggunakan state (interaktif)

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth";
import { getApiErrorMessage } from "@/services/api";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();

  // State untuk menyimpan ketikan user di form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi yang dipanggil saat tombol "Login" ditekan
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah halaman refresh otomatis
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Mencoba memanggil fungsi login dari services/auth.ts
      await login( email, password );
      
      // Jika berhasil, arahkan (redirect) admin ke halaman dashboard
      router.replace("/admin");
      router.refresh();
    } catch (error: unknown) {
      // Jika gagal (email/password salah), tampilkan pesan error dari backend
      setErrorMsg(
        getApiErrorMessage(error, "Terjadi kesalahan saat login.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-editorial-paper p-4 pt-20 sm:p-6 sm:pt-20">
      <ThemeToggle className="absolute right-4 top-4 sm:right-6 sm:top-6" />
      <div className="w-full max-w-md rounded-2xl border border-editorial-line bg-editorial-surface p-8 text-editorial-ink shadow-[var(--shadow-editorial)] transition-all duration-300 hover:-translate-y-1 hover:border-editorial-line-strong">
        <h2 className="mb-6 text-center text-2xl font-bold">
          Admin Login
        </h2>

        {/* Jika ada errorMsg, tampilkan kotak peringatan merah */}
        {errorMsg && (
          <div className="mb-4 rounded border border-editorial-danger/25 bg-editorial-danger/10 p-3 text-sm text-editorial-danger">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium ">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-2 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-2 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="min-h-11 w-full rounded bg-editorial-action py-2 text-editorial-on-action transition hover:bg-editorial-action-hover disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
