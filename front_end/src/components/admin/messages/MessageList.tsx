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
    } catch (error) {
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
    <div className="rounded-lg bg-gray-800 p-6 shadow-md border border-gray-700">
      <h2 className="mb-4 text-xl font-semibold text-white">Kotak Masuk Pesan</h2>
      
      {isLoading ? (
        <p className="text-gray-400">Memuat pesan...</p>
      ) : messages.length === 0 ? (
        <p className="text-gray-400">Tidak ada pesan masuk.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-700 text-xs uppercase text-gray-400">
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
                  className={`border-b border-gray-700 transition hover:bg-gray-750 ${msg.is_read ? 'opacity-60' : 'bg-gray-750'}`}
                >
                  <td className="px-4 py-3">
                    {!msg.is_read ? (
                      <span className="flex h-2 w-2 rounded-full bg-teal-500"></span>
                    ) : (
                      <span className="text-gray-500 text-xs">Read</span>
                    )}
                  </td>
                  
                  {/* Bagian Pengirim yang sudah dibungkus Link */}
                  <td className="px-4 py-3">
                    <Link href={`/admin/messages/${msg.id}`} className="hover:underline block">
                      <div className={!msg.is_read ? "font-bold text-white" : "text-gray-400"}>
                        {msg.name}
                      </div>
                      <div className="text-xs text-gray-500">{msg.email}</div>
                    </Link>
                  </td>

                  {/* Bagian Pesan yang sudah dibungkus Link */}
                  <td className={`px-4 py-3 max-w-xs ${!msg.is_read ? "font-medium text-gray-200" : "text-gray-400"}`}>
                    <Link href={`/admin/messages/${msg.id}`} className="hover:underline block truncate">
                      {msg.content}
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-xs text-gray-500">
                    {msg.created_at ? new Date(msg.created_at).toLocaleDateString('id-ID') : '-'}
                  </td>
                  
                  <td className="px-4 py-3 text-center space-x-3">
                    {!msg.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(msg.id)}
                        className="text-teal-400 hover:text-teal-300 text-xs font-semibold"
                      >
                        Tandai Baca
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(msg.id)}
                      className="text-red-500 hover:text-red-400 text-xs font-semibold"
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