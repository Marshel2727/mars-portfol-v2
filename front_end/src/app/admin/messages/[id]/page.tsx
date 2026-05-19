"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMessageById,markMessageAsRead, deleteMessage } from "@/services/messages";
import { Message } from "@/types";
import Link from "next/link";

export default function MessageDetailPage() {
  const { id } = useParams(); // Mengambil ID dari URL
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await getMessageById(Number(id));
        setMessage(data);

        // Otomatis tandai sebagai sudah dibaca saat halaman dibuka
        if (!data.is_read) {
          await markMessageAsRead(Number(id));
        }
      } catch (error) {
        console.error("Gagal memuat detail pesan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Hapus pesan ini?")) return;
    try {
      await deleteMessage(Number(id));
      router.push("/admin/messages"); // Balik ke inbox setelah hapus
    } catch (error) {
      alert("Gagal menghapus pesan.");
    }
  };

  if (isLoading) return <div className="p-8 text-white">Memuat pesan...</div>;
  if (!message) return <div className="p-8 text-white">Pesan tidak ditemukan.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tombol Kembali */}
      <Link
        href="/admin/messages"
        className="text-teal-400 hover:text-teal-300 flex items-center gap-2 mb-4 transition"
      >
        ← Kembali ke Kotak Masuk
      </Link>

      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        {/* Header Pesan (Ala Email) */}
        <div className="p-6 border-b border-gray-700 bg-gray-800/50">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Pesan dari {message.name}</h1>
              <div className="flex flex-col text-sm text-gray-400">
                <span>
                  <strong className="text-gray-300">Dari:</strong> {message.name} ({message.email})
                </span>
                <span>
                  <strong className="text-gray-300">Tanggal:</strong> {message.created_at ? new Date(message.created_at).toLocaleString('id-ID') : '-'}
                </span>
              </div>
            </div>
            <button
              onClick={handleDelete}
              className="bg-red-600/10 text-red-500 border border-red-600/20 px-4 py-2 rounded hover:bg-red-600 hover:text-white transition"
            >
              Hapus Pesan
            </button>
          </div>
        </div>

        {/* Isi Pesan */}
        <div className="p-8 text-gray-200 leading-relaxed whitespace-pre-wrap min-h-[300px] text-lg">
          {message.content}
        </div>
      </div>
    </div>
  );
}