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

function AboutProfileForm({ profile, onSaved }: { profile: AboutProfile; onSaved: () => void }) {
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

      await updateAboutProfile(formData);
      setProfileImage(null);
      onSaved();
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
      <section className="grid gap-8 border-y border-gray-700 py-7 lg:grid-cols-[16rem_1fr]">
        <div>
          <h2 className="text-lg font-bold text-white">Foto Profil</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Gunakan foto profesional dengan rasio potret. Format yang didukung: JPG, PNG, dan WebP.
          </p>
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <img
            src={profile.profile_image_url ? getImageUrl(profile.profile_image_url) : "/mars-porto-logo.png"}
            alt="Preview foto profil"
            className="aspect-[4/5] w-36 rounded-lg border border-gray-700 bg-gray-950 object-cover"
          />
          <div className="min-w-0 flex-1">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setProfileImage(event.target.files?.[0] || null)}
              className="w-full rounded border border-gray-700 bg-gray-950 p-2 text-sm text-gray-300 file:mr-4 file:rounded file:border-0 file:bg-teal-600 file:px-4 file:py-2 file:font-semibold file:text-white"
            />
            {profileImage && <p className="mt-2 truncate text-xs text-teal-300">{profileImage.name}</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-b border-gray-700 pb-8 lg:grid-cols-[16rem_1fr]">
        <div>
          <h2 className="text-lg font-bold text-white">Identitas Profesional</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Informasi utama yang akan dibaca pengunjung pada bagian Tentang Saya.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-300">Nama lengkap *</span>
            <input
              required value={fields.fullName} onChange={setField("fullName")}
              className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2.5 text-white focus:border-teal-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-300">Headline *</span>
            <input
              required value={fields.headline} onChange={setField("headline")}
              placeholder="Full-Stack Developer & IoT Enthusiast"
              className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2.5 text-white focus:border-teal-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-300">Pendidikan</span>
            <input
              value={fields.education} onChange={setField("education")}
              placeholder="Mahasiswa Teknik Komputer"
              className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2.5 text-white focus:border-teal-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-300">Lokasi</span>
            <input
              value={fields.location} onChange={setField("location")}
              placeholder="Kota, Indonesia"
              className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2.5 text-white focus:border-teal-500 focus:outline-none"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-8 border-b border-gray-700 pb-8 lg:grid-cols-[16rem_1fr]">
        <div>
          <h2 className="text-lg font-bold text-white">Narasi & Fokus</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Buat narasi singkat, spesifik, dan mudah dipahami recruiter maupun calon klien.
          </p>
        </div>
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-300">Tentang saya *</span>
            <textarea
              required rows={6} value={fields.bio} onChange={setField("bio")}
              className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2.5 leading-7 text-white focus:border-teal-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-300">Fokus saat ini</span>
            <textarea
              rows={4} value={fields.currentFocus} onChange={setField("currentFocus")}
              className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2.5 leading-7 text-white focus:border-teal-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-300">Tautan CV</span>
            <input
              type="url" value={fields.cvUrl} onChange={setField("cvUrl")}
              placeholder="https://drive.google.com/..."
              className="w-full rounded border border-gray-700 bg-gray-950 px-3 py-2.5 text-white focus:border-teal-500 focus:outline-none"
            />
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
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
        <p className="mb-2 text-sm font-semibold uppercase text-teal-400">Konten Publik</p>
        <h1 className="text-3xl font-bold text-white">Kelola About Profile</h1>
        <p className="mt-3 max-w-2xl leading-7 text-gray-400">
          Perbarui informasi yang tampil di halaman utama tanpa perlu mengubah kode.
        </p>
      </div>

      {isLoading && <p className="text-gray-400">Memuat profil...</p>}
      {!isLoading && profile && (
        <AboutProfileForm
          key={profile.updated_at || "default-profile"}
          profile={profile}
          onSaved={() => mutate()}
        />
      )}
    </div>
  );
}
