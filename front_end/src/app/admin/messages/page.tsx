"use client";

import { useEffect, useState } from "react";
import { getAllMessages } from "@/services/messages";
import { Message } from "@/types";
import MessagesList from "@/components/admin/messages/MessageList";


export default function MessageAdminPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const data = await getAllMessages();
      const sortedMessages = data.sort((a, b) => 
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
      setMessages(sortedMessages);
    } catch (error) {
      console.error("Gagal mengambil pesan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Pesan Masuk</h1>
        <p className="mt-2 text-gray-400">
          Daftar pesan dan pertanyaan yang dikirimkan oleh pengunjung melalui formulir kontak.
        </p>
      </div>

      {/* Menampilkan tabel pesan */}
      <MessagesList 
        messages={messages} 
        isLoading={isLoading} 
        onRefresh={loadMessages} 
      />
    </div>
  );
}