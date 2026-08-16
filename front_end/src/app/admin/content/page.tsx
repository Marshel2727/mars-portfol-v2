"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";

import { DEFAULT_SITE_CONTENT, mergeSiteContent, SiteContent } from "@/lib/siteContent";
import { getSiteContent, updateSiteContent } from "@/services/siteContent";

type TabKey = "hero" | "profile" | "brief" | "metrics";

const tabLabels: Record<TabKey, string> = {
  hero: "🚀 Hero & Ketersediaan",
  profile: "🎯 Profil & Filosofi",
  brief: "📋 Layanan & Brief Builder",
  metrics: "📊 Metrik Beranda",
};

export default function AdminContentPage() {
  const { data, isLoading, error, mutate } = useSWR("/site-content/", getSiteContent);
  const [draft, setDraft] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [activeTab, setActiveTab] = useState<TabKey>("hero");
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: "success" | "error" | "" }>({ message: "", type: "" });
  const [newTech, setNewTech] = useState("");

  useEffect(() => {
    if (data?.content) {
      setDraft(mergeSiteContent(data.content));
    }
  }, [data?.content]);

  const handleSave = async () => {
    setIsSaving(true);
    setNotice({ message: "", type: "" });
    try {
      const updated = await updateSiteContent(draft);
      setDraft(mergeSiteContent(updated.content));
      await mutate(updated, { revalidate: false });
      setNotice({ message: "Konten website berhasil disimpan dan diperbarui!", type: "success" });
    } catch (saveError) {
      console.error("Gagal menyimpan konten website", saveError);
      setNotice({ message: "Gagal menyimpan konten. Periksa koneksi API.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper untuk manipulasi tech stack
  const handleAddTech = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTech.trim();
    if (!tag) return;
    if (draft.home.tech_stack.includes(tag)) {
      setNewTech("");
      return;
    }
    setDraft((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        tech_stack: [...prev.home.tech_stack, tag],
      },
    }));
    setNewTech("");
  };

  const handleRemoveTech = (tagToRemove: string) => {
    setDraft((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        tech_stack: prev.home.tech_stack.filter((t) => t !== tagToRemove),
      },
    }));
  };

  // Helper untuk project types
  const handleAddProjectType = () => {
    const newId = `type_${Date.now()}`;
    setDraft((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        project_types: [
          ...prev.home.project_types,
          { id: newId, label: "Layanan Baru", description: "Deskripsi singkat kebutuhan sistem atau aplikasi." },
        ],
      },
    }));
  };

  const handleUpdateProjectType = (index: number, field: "label" | "description", val: string) => {
    setDraft((prev) => {
      const nextTypes = [...prev.home.project_types];
      nextTypes[index] = { ...nextTypes[index], [field]: val };
      return { ...prev, home: { ...prev.home, project_types: nextTypes } };
    });
  };

  const handleRemoveProjectType = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        project_types: prev.home.project_types.filter((_, i) => i !== index),
      },
    }));
  };

  // Helper untuk metrics
  const handleUpdateMetric = (index: number, field: "value" | "label", val: string) => {
    setDraft((prev) => {
      const nextMetrics = [...prev.home.metrics];
      nextMetrics[index] = { ...nextMetrics[index], [field]: val };
      return { ...prev, home: { ...prev.home, metrics: nextMetrics } };
    });
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-editorial-technical">Pengaturan Konten Publik</p>
          <h1 className="text-2xl font-bold text-editorial-ink sm:text-3xl">Kelola Konten Esensial</h1>
          <p className="mt-1 text-sm text-editorial-muted">
            Atur headline beranda, status ketersediaan, daftar teknologi utama, profil, dan opsi brief secara instan.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-editorial-line-strong bg-editorial-surface px-4 py-2.5 text-sm font-semibold text-editorial-technical transition hover:bg-editorial-paper-deep"
        >
          Lihat Website ↗
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {(Object.keys(tabLabels) as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab
                ? "bg-editorial-action text-editorial-on-action shadow-sm"
                : "border border-editorial-line bg-editorial-surface text-editorial-ink hover:border-editorial-line-strong hover:bg-editorial-paper-deep"
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {isLoading && <p className="py-8 text-editorial-muted">Memuat konten website...</p>}
      {error && (
        <p className="rounded-lg border border-editorial-danger/30 bg-editorial-danger/10 p-4 text-editorial-danger">
          Konten website gagal dimuat dari API. Pastikan backend server berjalan normal.
        </p>
      )}

      {!isLoading && !error && (
        <section className="rounded-xl border border-editorial-line bg-editorial-surface p-6 shadow-[var(--shadow-editorial)] sm:p-8">

          {/* TAB 1: HERO & STATUS */}
          {activeTab === "hero" && (
            <div className="space-y-6">
              <div className="border-b border-editorial-line pb-4">
                <h2 className="text-lg font-bold text-editorial-ink">Hero Section & Status Ketersediaan</h2>
                <p className="text-xs text-editorial-muted">Teks utama yang pertama kali dilihat oleh pengunjung website.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                  Judul Utama Hero (Hero Title)
                </label>
                <input
                  type="text"
                  value={draft.home.hero_title}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, home: { ...prev.home, hero_title: e.target.value } }))
                  }
                  className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface px-3.5 py-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
                  placeholder="Membangun software yang terhubung dengan dunia nyata."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                  Deskripsi Singkat Hero (Hero Description)
                </label>
                <textarea
                  rows={3}
                  value={draft.home.hero_description}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, home: { ...prev.home, hero_description: e.target.value } }))
                  }
                  className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface px-3.5 py-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
                  placeholder="Penjelasan keahlian dan nilai unik Anda..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                  Label Status Ketersediaan (Availability Status)
                </label>
                <input
                  type="text"
                  value={draft.global.availability_label}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, global: { ...prev.global, availability_label: e.target.value } }))
                  }
                  className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface px-3.5 py-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
                  placeholder="TERBUKA UNTUK KOLABORASI & PROYEK"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                  Daftar Teknologi Utama di Hero (Core Tech Stack)
                </label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {draft.home.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1.5 rounded-md border border-editorial-line-strong bg-editorial-paper-deep px-2.5 py-1 text-xs font-semibold text-editorial-ink"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="text-editorial-muted hover:text-editorial-danger"
                        title={`Hapus ${tech}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddTech} className="flex max-w-sm gap-2">
                  <input
                    type="text"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    placeholder="Tambah teknologi baru (cth: Docker)..."
                    className="flex-1 rounded-lg border border-editorial-line-strong bg-editorial-surface px-3 py-1.5 text-sm text-editorial-ink focus:border-editorial-technical focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-editorial-technical bg-editorial-surface px-3 py-1.5 text-xs font-bold text-editorial-technical transition hover:bg-editorial-paper-deep"
                  >
                    + Tambah
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: PROFIL & FILOSOFI */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="border-b border-editorial-line pb-4">
                <h2 className="text-lg font-bold text-editorial-ink">Profil & Filosofi Rekayasa</h2>
                <p className="text-xs text-editorial-muted">Pengaturan narasi filosofi dan fokus disiplin rekayasa.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                  Fokus Disiplin (Profile Discipline Tag)
                </label>
                <input
                  type="text"
                  value={draft.home.profile_discipline}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, home: { ...prev.home, profile_discipline: e.target.value } }))
                  }
                  className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface px-3.5 py-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
                  placeholder="Full-Stack Web & IoT Systems Engineer"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                  Bio Singkat Beranda (Fallback Bio)
                </label>
                <textarea
                  rows={3}
                  value={draft.home.profile_fallback_bio}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, home: { ...prev.home, profile_fallback_bio: e.target.value } }))
                  }
                  className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface px-3.5 py-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                    Label Kutipan Filosofi
                  </label>
                  <input
                    type="text"
                    value={draft.home.principle_label}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, home: { ...prev.home, principle_label: e.target.value } }))
                    }
                    className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface px-3.5 py-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
                    placeholder="ENGINEERING PHILOSOPHY"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-editorial-technical">
                    Isi Kutipan / Prinsip Rekayasa
                  </label>
                  <input
                    type="text"
                    value={draft.home.principle_text}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, home: { ...prev.home, principle_text: e.target.value } }))
                    }
                    className="w-full rounded-lg border border-editorial-line-strong bg-editorial-surface px-3.5 py-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
                    placeholder="Clarity first. Complexity stays behind the interface."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LAYANAN & BRIEF BUILDER */}
          {activeTab === "brief" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-editorial-line pb-4">
                <div>
                  <h2 className="text-lg font-bold text-editorial-ink">Pilihan Layanan & Brief Builder</h2>
                  <p className="text-xs text-editorial-muted">Kategori proyek interaktif yang dapat dipilih klien di beranda.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddProjectType}
                  className="rounded-lg border border-editorial-technical bg-editorial-surface px-3.5 py-2 text-xs font-bold text-editorial-technical transition hover:bg-editorial-paper-deep"
                >
                  + Tambah Layanan
                </button>
              </div>

              <div className="space-y-4">
                {draft.home.project_types.map((type, index) => (
                  <div
                    key={type.id || index}
                    className="flex flex-col gap-3 rounded-lg border border-editorial-line bg-editorial-paper-deep/40 p-4 sm:flex-row sm:items-start"
                  >
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-editorial-technical">
                          Nama Kategori Layanan
                        </label>
                        <input
                          type="text"
                          value={type.label}
                          onChange={(e) => handleUpdateProjectType(index, "label", e.target.value)}
                          className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-1.5 text-sm text-editorial-ink focus:border-editorial-technical focus:outline-none"
                          placeholder="Web Application"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-editorial-technical">
                          Deskripsi Ekspektasi Klien
                        </label>
                        <input
                          type="text"
                          value={type.description}
                          onChange={(e) => handleUpdateProjectType(index, "description", e.target.value)}
                          className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-1.5 text-sm text-editorial-ink focus:border-editorial-technical focus:outline-none"
                          placeholder="Aplikasi web interaktif dengan performa tinggi..."
                        />
                      </div>
                    </div>

                    {draft.home.project_types.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProjectType(index)}
                        className="self-end rounded border border-editorial-danger/30 px-2.5 py-1 text-xs font-semibold text-editorial-danger transition hover:bg-editorial-danger/10 sm:self-center"
                        title="Hapus layanan ini"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: METRIK BERANDA */}
          {activeTab === "metrics" && (
            <div className="space-y-6">
              <div className="border-b border-editorial-line pb-4">
                <h2 className="text-lg font-bold text-editorial-ink">3 Kartu Metrik Counter di Beranda</h2>
                <p className="text-xs text-editorial-muted">
                  Gunakan <code className="rounded bg-editorial-paper-deep px-1.5 py-0.5 font-mono text-xs">AUTO_PROJECT_COUNT</code> untuk menghitung jumlah proyek secara otomatis.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {draft.home.metrics.map((metric, index) => (
                  <div key={index} className="space-y-3 rounded-lg border border-editorial-line bg-editorial-paper-deep/40 p-4">
                    <span className="text-xs font-bold text-editorial-muted">Metrik #{index + 1}</span>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-editorial-technical">Nilai / Angka</label>
                      <input
                        type="text"
                        value={metric.value}
                        onChange={(e) => handleUpdateMetric(index, "value", e.target.value)}
                        className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-1.5 text-sm font-bold text-editorial-ink focus:border-editorial-technical focus:outline-none"
                        placeholder="03 / 100% / AUTO_PROJECT_COUNT"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-editorial-technical">Keterangan Label</label>
                      <input
                        type="text"
                        value={metric.label}
                        onChange={(e) => handleUpdateMetric(index, "label", e.target.value)}
                        className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-1.5 text-xs text-editorial-ink focus:border-editorial-technical focus:outline-none"
                        placeholder="Pilar Rekayasa..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions Bar */}
          <div className="sticky bottom-0 mt-8 flex flex-col items-center justify-between gap-3 border-t border-editorial-line bg-editorial-surface/95 pt-5 backdrop-blur sm:flex-row">
            {notice.message ? (
              <p
                className={`text-sm font-semibold ${
                  notice.type === "error" ? "text-editorial-danger" : "text-editorial-success"
                }`}
                role="status"
              >
                {notice.message}
              </p>
            ) : (
              <span className="text-xs text-editorial-muted">Perubahan langsung aktif di website publik setelah disimpan.</span>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-lg bg-editorial-action px-6 py-2.5 text-sm font-semibold text-editorial-on-action transition hover:bg-editorial-action-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSaving ? "Menyimpan Perubahan..." : "Simpan Konten Website"}
            </button>
          </div>

        </section>
      )}
    </div>
  );
}
