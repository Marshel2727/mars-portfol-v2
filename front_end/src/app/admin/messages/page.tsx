"use client";

import useSWR from "swr";
import { getAllMessages } from "@/services/messages";
import MessagesList from "@/components/admin/messages/MessageList";

export default function MessageAdminPage() {
  const { data: rawMessages, error, isLoading, mutate } = useSWR("/messages/", () => getAllMessages());

  // Sorting pesan terbaru ke terlama
  const messages = Array.isArray(rawMessages)
    ? [...rawMessages].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    : [];
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Pesan Masuk</h1>
        <p className="mt-2 text-gray-400">
          Daftar pesan dan pertanyaan yang dikirimkan oleh pengunjung melalui formulir kontak.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-md text-sm">
          Gagal memuat pesan: {error.message || "Pastikan Anda sudah login sebagai Admin."}
        </div>
      )}

      {/* Menampilkan tabel pesan */}
      <MessagesList 
        messages={messages} 
        isLoading={isLoading} 
        onRefresh={mutate} 
      />
    </div>
  );
}