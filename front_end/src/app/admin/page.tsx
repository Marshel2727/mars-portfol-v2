"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { getAllProjects } from "@/services/project";
import { getAllSkill } from "@/services/Skils";
import { getAllMessages } from "@/services/messages";
import StatCard from "@/components/ui/StatCard";
import api from "@/services/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function AdminDashboard() {
  const { data: rawProjects, isLoading: loadingProjects } = useSWR("/projects/", () => getAllProjects());
  const { data: rawSkills, isLoading: loadingSkills } = useSWR("/skills/", () => getAllSkill());
  const { data: rawMessages, isLoading: loadingMessages } = useSWR("/messages/", () => getAllMessages());

  const projects = Array.isArray(rawProjects) ? rawProjects : [];
  const skills = Array.isArray(rawSkills) ? rawSkills : [];
  const messages = Array.isArray(rawMessages) ? rawMessages : [];

  const isLoading = loadingProjects || loadingSkills || loadingMessages;

  // State for notifications
  const [notificationStatus, setNotificationStatus] = useState<"default" | "granted" | "denied" | "unsupported">("default");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setNotificationStatus("unsupported");
        return;
      }
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const handleSubscribe = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    try {
      setIsSubscribing(true);
      setMessage("");

      // 1. Request permission
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);

      if (permission !== "granted") {
        setMessage("Izin notifikasi ditolak.");
        return;
      }

      // 2. Register push manager
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing");
        setMessage("VAPID Public Key belum dikonfigurasi di Vercel.");
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      // 3. Send subscription object to backend
      const response = await api.post("/auth/subscribe", subscription);
      
      if (response.data.status === "success") {
        setMessage("Notifikasi HP berhasil diaktifkan!");
      } else {
        setMessage(response.data.message || "Gagal menyimpan subscription.");
      }

    } catch (error: any) {
      console.error("Error subscribing to push notifications:", error);
      setMessage(error.response?.data?.message || error.message || "Gagal mendaftarkan perangkat.");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-gray-100 text-center">Dashboard Overview</h1>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="Total Proyek" value={projects.length} isLoading={isLoading} />
        <StatCard title="Total Skill" value={skills.length} isLoading={isLoading} />
        <StatCard title="Pesan Masuk" value={messages.length} isLoading={isLoading} />
      </div>

      <div className="mt-12 p-6 bg-gray-800/40 rounded-2xl border border-gray-700/50 backdrop-blur-md max-w-md mx-auto text-center shadow-xl">
        <h2 className="text-xl font-semibold text-gray-100 mb-2">Notifikasi HP Admin</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Terima pemberitahuan instan langsung di HP Anda saat pengunjung mengirimkan pesan baru pada form kontak portofolio.
        </p>

        {notificationStatus === "unsupported" && (
          <p className="text-yellow-500 text-sm">Browser ini tidak mendukung notifikasi push.</p>
        )}

        {notificationStatus === "granted" && (
          <div className="space-y-4">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              🟢 Notifikasi Aktif di HP Ini
            </span>
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="w-full py-2.5 px-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-100 rounded-xl transition font-medium text-sm border border-gray-600/50 cursor-pointer"
            >
              {isSubscribing ? "Sinkronisasi..." : "Sinkronkan Ulang Perangkat"}
            </button>
          </div>
        )}

        {notificationStatus === "denied" && (
          <p className="text-red-400 text-sm leading-relaxed">
            Izin notifikasi diblokir. Harap aktifkan izin notifikasi situs di pengaturan browser HP Anda terlebih dahulu.
          </p>
        )}

        {notificationStatus === "default" && (
          <button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-gray-100 rounded-xl transition font-semibold text-sm shadow-lg shadow-emerald-950/20 cursor-pointer active:scale-[0.98]"
          >
            {isSubscribing ? "Mendaftarkan..." : "Aktifkan Notifikasi HP"}
          </button>
        )}

        {message && (
          <p className="mt-4 text-xs text-gray-300 bg-gray-900/60 py-2 px-4 rounded-xl inline-block border border-gray-800">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}