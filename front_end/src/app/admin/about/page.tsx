"use client";

import { useState } from "react";
import useSWR from "swr";

import { getImageUrl } from "@/lib/utils";
import { getAboutProfile, updateAboutProfile } from "@/services/about";
import { AboutProfile } from "@/types";


const buildInitialFields = (profile: AboutProfile) => ({
  fullName: profile.full_name || "",
  headline: profile.headline || "",
  bio: profile.bio || "",
  education: profile.education || "",
  location: profile.location || "",
  currentFocus: profile.current_focus || "",
  cvUrl: profile.cv_url || "",
});

function AboutProfileForm({ profile, onSaved }: { profile: AboutProfile; onSaved: (profile: AboutProfile) => void }) {
  const [fields, setFields] = useState(() => buildInitialFields(profile));
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (key: keyof typeof fields) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFields((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("full_name", fields.fullName);
      formData.append("headline", fields.headline);
      formData.append("bio", fields.bio);
      formData.append("education", fields.education);
      formData.append("location", fields.location);
      formData.append("current_focus", fields.currentFocus);
      formData.append("cv_url", fields.cvUrl);
      if (profileImage) formData.append("profile_image", profileImage);

      const updatedProfile = await updateAboutProfile(formData);
      setProfileImage(null);
      onSaved(updatedProfile);
      alert("Profil About berhasil diperbarui.");
    } catch (error) {
      console.error("Gagal memperbarui profil About", error);
      alert("Profil About gagal diperbarui.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="grid gap-8 border-y border-editorial-line py-7 lg:grid-cols-[16rem_1fr]">
        <div>
          <h2 className="text-lg font-bold text-editorial-ink">Foto Profil</h2>
          <p className="mt-2 text-sm leading-6 text-editorial-muted">
            Gunakan foto profesional dengan rasio potret. Format yang didukung: JPG, PNG, dan WebP.
          </p>
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <img
            src={profile.profile_image_url ? getImageUrl(profile.profile_image_url) : "/mars-porto-logo.png"}
            alt="Preview foto profil"
            className="aspect-[4/5] w-36 rounded-lg border border-editorial-line bg-editorial-paper-deep object-cover"
          />
          <div className="min-w-0 flex-1">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setProfileImage(event.target.files?.[0] || null)}
              className="w-full rounded border border-editorial-line-strong bg-editorial-surface p-2 text-sm text-editorial-ink file:mr-4 file:rounded file:border-0 file:bg-editorial-action file:px-4 file:py-2 file:font-semibold file:text-editorial-on-action hover:file:bg-editorial-action-hover"
            />
            {profileImage && <p className="mt-2 truncate text-xs text-editorial-technical">{profileImage.name}</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-b border-editorial-line pb-8 lg:grid-cols-[16rem_1fr]">
        <div>
          <h2 className="text-lg font-bold text-editorial-ink">Identitas Profesional</h2>
          <p className="mt-2 text-sm leading-6 text-editorial-muted">
            Informasi utama yang akan dibaca pengunjung pada bagian Tentang Saya.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-editorial-technical">Nama lengkap *</span>
            <input
              required value={fields.fullName} onChange={setField("fullName")}
              className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-editorial-technical">Headline *</span>
            <input
              required value={fields.headline} onChange={setField("headline")}
              placeholder="Full-Stack Developer & IoT Enthusiast"
              className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-editorial-technical">Pendidikan</span>
            <input
              value={fields.education} onChange={setField("education")}
              placeholder="Mahasiswa Teknik Komputer"
              className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-editorial-technical">Lokasi</span>
            <input
              value={fields.location} onChange={setField("location")}
              placeholder="Kota, Indonesia"
              className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-8 border-b border-editorial-line pb-8 lg:grid-cols-[16rem_1fr]">
        <div>
          <h2 className="text-lg font-bold text-editorial-ink">Narasi & Fokus</h2>
          <p className="mt-2 text-sm leading-6 text-editorial-muted">
            Buat narasi singkat, spesifik, dan mudah dipahami recruiter maupun calon klien.
          </p>
        </div>
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-editorial-technical">Tentang saya *</span>
            <textarea
              required rows={6} value={fields.bio} onChange={setField("bio")}
              className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-2.5 leading-7 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-editorial-technical">Fokus saat ini</span>
            <textarea
              rows={4} value={fields.currentFocus} onChange={setField("currentFocus")}
              className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-2.5 leading-7 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-editorial-technical">Tautan CV</span>
            <input
              type="url" value={fields.cvUrl} onChange={setField("cvUrl")}
              placeholder="https://drive.google.com/..."
              className="w-full rounded border border-editorial-line-strong bg-editorial-surface px-3 py-2.5 text-editorial-ink focus:border-editorial-technical focus:outline-none focus:ring-1 focus:ring-editorial-technical"
            />
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 rounded-lg bg-editorial-action px-6 py-3 font-semibold text-editorial-on-action transition hover:bg-editorial-action-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Profil About"}
        </button>
      </div>
    </form>
  );
}

export default function AboutAdminPage() {
  const { data: profile, isLoading, mutate } = useSWR("/about/", () => getAboutProfile());

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase text-editorial-technical">Konten Publik</p>
        <h1 className="text-3xl font-bold text-editorial-ink">Kelola About Profile</h1>
        <p className="mt-3 max-w-2xl leading-7 text-editorial-muted">
          Perbarui informasi yang tampil di halaman utama tanpa perlu mengubah kode.
        </p>
      </div>

      {isLoading && <p className="text-editorial-muted">Memuat profil...</p>}
      {!isLoading && profile && (
        <section className="rounded-xl border border-editorial-line bg-editorial-surface p-6 shadow-[var(--shadow-editorial)] sm:p-8">
          <AboutProfileForm
            key={profile.updated_at || "default-profile"}
            profile={profile}
            onSaved={(updatedProfile) => mutate(updatedProfile, { revalidate: false })}
          />
        </section>
      )}
    </div>
  );
}
