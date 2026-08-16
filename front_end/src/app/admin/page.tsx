"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { getAllProjects } from "@/services/project";
import { getAllSkill } from "@/services/Skils";
import { getAllMessages } from "@/services/messages";
import StatCard from "@/components/ui/StatCard";
import api, { getApiErrorMessage } from "@/services/api";

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

    } catch (error: unknown) {
      console.error("Error subscribing to push notifications:", error);
      setMessage(getApiErrorMessage(error, "Gagal mendaftarkan perangkat."));
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-center text-3xl font-bold text-editorial-ink">Dashboard Overview</h1>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="Total Proyek" value={projects.length} isLoading={isLoading} />
        <StatCard title="Total Skill" value={skills.length} isLoading={isLoading} />
        <StatCard title="Pesan Masuk" value={messages.length} isLoading={isLoading} />
      </div>

      <div className="mx-auto mt-12 max-w-md rounded-2xl border border-editorial-line bg-editorial-surface p-6 text-center shadow-[var(--shadow-editorial)] md:hidden">
        <h2 className="mb-2 text-xl font-semibold text-editorial-ink">Notifikasi HP Admin</h2>
        <p className="mb-6 text-sm leading-relaxed text-editorial-muted">
          Terima pemberitahuan instan langsung di HP Anda saat pengunjung mengirimkan pesan baru pada form kontak portofolio.
        </p>

        {notificationStatus === "unsupported" && (
          <p className="text-sm text-editorial-accent-strong">Browser ini tidak mendukung notifikasi push.</p>
        )}

        {notificationStatus === "granted" && (
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full border border-editorial-success/20 bg-editorial-success/10 px-4 py-1.5 text-xs font-semibold text-editorial-success">
              🟢 Notifikasi Aktif di HP Ini
            </span>
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="w-full cursor-pointer rounded-xl border border-editorial-line-strong bg-editorial-paper-deep px-4 py-2.5 text-sm font-medium text-editorial-ink transition hover:bg-editorial-paper disabled:opacity-50"
            >
              {isSubscribing ? "Sinkronisasi..." : "Sinkronkan Ulang Perangkat"}
            </button>
          </div>
        )}

        {notificationStatus === "denied" && (
          <p className="text-sm leading-relaxed text-editorial-danger">
            Izin notifikasi diblokir. Harap aktifkan izin notifikasi situs di pengaturan browser HP Anda terlebih dahulu.
          </p>
        )}

        {notificationStatus === "default" && (
          <button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="min-h-11 w-full cursor-pointer rounded-xl bg-editorial-action px-6 py-3 text-sm font-semibold text-editorial-on-action shadow-lg transition hover:bg-editorial-action-hover disabled:opacity-50 active:scale-[0.98]"
          >
            {isSubscribing ? "Mendaftarkan..." : "Aktifkan Notifikasi HP"}
          </button>
        )}

        {message && (
          <p className="mt-4 inline-block rounded-xl border border-editorial-line bg-editorial-paper-deep px-4 py-2 text-xs text-editorial-muted">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
