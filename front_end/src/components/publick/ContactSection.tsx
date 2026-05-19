"use client";

import { useState } from "react";
import { createMessage } from "../../services/messages";

export default function ContactSection() {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState("");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendStatus("");
    try {
      await createMessage({ name: contactName, email: contactEmail, content: contactMessage });
      setSendStatus("success");
      setContactName(""); setContactEmail(""); setContactMessage("");
    } catch (error) {
      setSendStatus("error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-gray-800/50 border-t border-gray-800">
      <div className="max-w-3xl mx-auto px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Mari Berkolaborasi</h2>
        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 shadow-xl">
          {sendStatus === "success" && <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/50 text-teal-400 rounded-lg text-center">Pesan berhasil dikirim! 🚀</div>}
          {sendStatus === "error" && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-center">Gagal mengirim pesan.</div>}
          <form onSubmit={handleSendMessage} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nama Anda</label>
                <input type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-teal-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email Anda</label>
                <input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-teal-500 outline-none transition" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Pesan</label>
              <textarea required rows={4} value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-teal-500 outline-none transition"></textarea>
            </div>
            <button type="submit" disabled={isSending} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50">
              {isSending ? "Mengirim..." : "Kirim Pesan"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}