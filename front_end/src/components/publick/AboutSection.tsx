"use client";

import { motion } from "framer-motion";

import { getImageUrl } from "@/lib/utils";
import { AboutProfile } from "@/types";


export const DEFAULT_ABOUT_PROFILE: AboutProfile = {
  id: 1,
  full_name: "Marshel",
  headline: "Full-Stack Developer & IoT Enthusiast",
  bio: "Saya adalah mahasiswa Teknik Komputer yang menikmati proses mengubah kebutuhan nyata menjadi aplikasi yang dapat digunakan. Saya terbiasa mengerjakan antarmuka, backend, database, deployment, hingga integrasi perangkat IoT.",
  education: "Mahasiswa Teknik Komputer",
  location: "Indonesia",
  current_focus: "Memperkuat kemampuan full-stack development dan membangun sistem yang stabil, mudah dipelihara, serta relevan bagi penggunanya.",
};

export default function AboutSection({ profile }: { profile?: AboutProfile }) {
  const content = profile || DEFAULT_ABOUT_PROFILE;
  const imageUrl = content.profile_image_url
    ? getImageUrl(content.profile_image_url)
    : "/mars-porto-logo.png";

  return (
    <section className="border-y border-gray-800 bg-gray-950/35 py-20 sm:py-24" aria-labelledby="about-title">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="relative mx-auto w-full max-w-sm lg:max-w-none"
        >
          <div className="relative origin-bottom transition-transform duration-300 ease-out lg:rotate-2 lg:hover:rotate-0">
            <img
              src={imageUrl}
              alt={`Foto profil ${content.full_name}`}
              className="aspect-[4/5] w-full rounded-lg border border-gray-700 bg-gray-950 object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/10 bg-gray-950/90 px-4 py-3 backdrop-blur-md">
              <p className="font-bold text-white">{content.full_name}</p>
              <p className="mt-0.5 text-sm text-teal-300">{content.headline}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <p className="mb-3 text-sm font-bold uppercase text-teal-400">Tentang Saya</p>
          <h2 id="about-title" className="max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            Membangun solusi digital dari kebutuhan nyata.
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-8 text-gray-300 sm:text-lg">{content.bio}</p>

          <dl className="mt-8 grid gap-5 border-y border-gray-800 py-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-gray-500">Pendidikan</dt>
              <dd className="mt-2 font-semibold text-gray-100">{content.education || "Belum ditambahkan"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-gray-500">Lokasi</dt>
              <dd className="mt-2 font-semibold text-gray-100">{content.location || "Belum ditambahkan"}</dd>
            </div>
          </dl>

          <div className="mt-7 border-l-2 border-teal-500 pl-5">
            <p className="text-xs font-semibold uppercase text-gray-500">Fokus Saat Ini</p>
            <p className="mt-2 max-w-2xl leading-7 text-gray-300">
              {content.current_focus || "Sedang memperkuat kemampuan full-stack development dan IoT."}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
