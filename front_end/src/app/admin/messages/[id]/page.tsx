"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMessageById,markMessageAsRead, deleteMessage } from "@/services/messages";
import { Message } from "@/types";
import Link from "next/link";
import ConfirmModal from "@/components/admin/ConfirmModal";

export default function MessageDetailPage() {
  const { id } = useParams(); // Mengambil ID dari URL
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMessage(Number(id));
      router.push("/admin/messages"); // Balik ke inbox setelah hapus
    } catch {
      console.error("Gagal menghapus pesan.");
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  if (isLoading) return <div className="p-8 text-editorial-muted">Memuat pesan...</div>;
  if (!message) return <div className="p-8 text-editorial-muted">Pesan tidak ditemukan.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tombol Kembali */}
      <Link
        href="/admin/messages"
        className="mb-4 flex items-center gap-2 text-editorial-technical transition hover:text-editorial-accent-strong"
      >
        ← Kembali ke Kotak Masuk
      </Link>

      <div className="overflow-hidden rounded-lg border border-editorial-line bg-editorial-surface shadow-[var(--shadow-editorial)]">
        {/* Header Pesan (Ala Email) */}
        <div className="border-b border-editorial-line bg-editorial-paper-deep p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-editorial-ink">Pesan dari {message.name}</h1>
              <div className="flex flex-col text-sm text-editorial-muted">
                <span>
                  <strong className="text-editorial-ink">Dari:</strong> {message.name} ({message.email})
                </span>
                <span>
                  <strong className="text-editorial-ink">Tanggal:</strong> {message.created_at ? new Date(message.created_at).toLocaleString('id-ID') : '-'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="min-h-11 rounded border border-editorial-danger/20 bg-editorial-danger/10 px-4 py-2 text-editorial-danger transition hover:bg-editorial-danger hover:text-editorial-on-action"
            >
              Hapus Pesan
            </button>
          </div>
        </div>

        {/* Isi Pesan */}
        <div className="min-h-[300px] whitespace-pre-wrap p-8 text-lg leading-relaxed text-editorial-ink">
          {message.content}
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Hapus Pesan"
        message={`Apakah Anda yakin ingin menghapus pesan dari "${message.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
