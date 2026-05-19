"use client"; // Wajib ditambahkan jika halaman menggunakan state (interaktif)

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth";

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
      router.push("/admin");
    } catch (error: any) {
      // Jika gagal (email/password salah), tampilkan pesan error dari backend
      setErrorMsg(
        error.response?.data?.message || "Terjadi kesalahan saat login."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-800 to-emerald-900">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-8 shadow-2xl transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] hover:shadow-blue-500/20 text-white">
        <h2 className="mb-6 text-center text-2xl font-bold">
          Admin Login
        </h2>

        {/* Jika ada errorMsg, tampilkan kotak peringatan merah */}
        {errorMsg && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
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
              className="w-full rounded border bg-white/60 px-3 py-2  focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-green-600 text-black"
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
              className="w-full rounded border bg-white/60 px-3 py-2 focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-green-600 text-black"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-gray-500 py-2 text-white hover:bg-cyan-900 transition disabled:bg-blue-300"
          >
            {isLoading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}