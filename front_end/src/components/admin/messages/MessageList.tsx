"use client";

import { Message } from "@/types";
import { deleteMessage, markMessageAsRead } from "@/services/messages";
import Link from "next/link"; // Tambahan import Link

interface MessageListProps { // Memperbaiki typo Props
  messages: Message[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function MessagesList({ messages, isLoading, onRefresh }: MessageListProps) {
  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin hapus pesan ini?')) return;
    try {
      await deleteMessage(id);
      onRefresh();
    } catch {
      alert('Gagal menghapus pesan.');
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markMessageAsRead(id);
      onRefresh();
    } catch (error) {
      console.error('Gagal update status baca', error);
    }
  };

  return (
    <div className="rounded-lg border border-editorial-line bg-editorial-surface p-6 shadow-[var(--shadow-editorial)]">
      <h2 className="mb-4 text-xl font-semibold text-editorial-ink">Kotak Masuk Pesan</h2>
      
      {isLoading ? (
        <p className="text-editorial-muted">Memuat pesan...</p>
      ) : messages.length === 0 ? (
        <p className="text-editorial-muted">Tidak ada pesan masuk.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-editorial-ink">
            <thead className="bg-editorial-paper-deep text-xs uppercase text-editorial-muted">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pengirim</th>
                <th className="px-4 py-3">Pesan</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr 
                  key={msg.id} 
                  className={`border-b border-editorial-line transition hover:bg-editorial-paper-deep ${msg.is_read ? 'opacity-60' : 'bg-editorial-paper-deep'}`}
                >
                  <td className="px-4 py-3">
                    {!msg.is_read ? (
                      <span className="flex h-2 w-2 rounded-full bg-editorial-technical"></span>
                    ) : (
                      <span className="text-xs text-editorial-muted">Read</span>
                    )}
                  </td>
                  
                  {/* Bagian Pengirim yang sudah dibungkus Link */}
                  <td className="px-4 py-3">
                    <Link href={`/admin/messages/${msg.id}`} className="hover:underline block">
                      <div className={!msg.is_read ? "font-bold text-editorial-ink" : "text-editorial-muted"}>
                        {msg.name}
                      </div>
                      <div className="text-xs text-editorial-muted">{msg.email}</div>
                    </Link>
                  </td>

                  {/* Bagian Pesan yang sudah dibungkus Link */}
                  <td className={`max-w-xs px-4 py-3 ${!msg.is_read ? "font-medium text-editorial-ink" : "text-editorial-muted"}`}>
                    <Link href={`/admin/messages/${msg.id}`} className="hover:underline block truncate">
                      {msg.content}
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-xs text-editorial-muted">
                    {msg.created_at ? new Date(msg.created_at).toLocaleDateString('id-ID') : '-'}
                  </td>
                  
                  <td className="px-4 py-3 text-center space-x-3">
                    {!msg.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(msg.id)}
                        className="text-xs font-semibold text-editorial-technical hover:text-editorial-accent-strong"
                      >
                        Tandai Baca
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(msg.id)}
                      className="text-xs font-semibold text-editorial-danger hover:text-editorial-accent-strong"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
