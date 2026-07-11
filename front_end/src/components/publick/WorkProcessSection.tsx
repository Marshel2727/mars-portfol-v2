"use client";

import { motion } from "framer-motion";


const WORK_STEPS = [
  {
    number: "01",
    title: "Memahami Kebutuhan",
    description: "Menggali tujuan, pengguna, dan masalah utama agar solusi yang dibangun tetap relevan.",
  },
  {
    number: "02",
    title: "Merancang Solusi",
    description: "Menyusun alur, arsitektur, dan antarmuka yang jelas sebelum masuk ke tahap implementasi.",
  },
  {
    number: "03",
    title: "Membangun",
    description: "Mengembangkan frontend, backend, database, atau integrasi perangkat sesuai kebutuhan project.",
  },
  {
    number: "04",
    title: "Menguji & Menyempurnakan",
    description: "Memastikan fungsi, pengalaman pengguna, dan stabilitas sistem siap digunakan dan dikembangkan.",
  },
];

export default function WorkProcessSection() {
  return (
    <section className="bg-gray-900 py-20 sm:py-24" aria-labelledby="work-process-title">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase text-teal-400">Cara Saya Bekerja</p>
          <h2 id="work-process-title" className="text-3xl font-extrabold text-white sm:text-4xl">
            Proses yang terarah, dari masalah hingga solusi.
          </h2>
        </div>

        <div className="mt-12 grid border-y border-gray-800 md:grid-cols-2 lg:grid-cols-4">
          {WORK_STEPS.map((step, index) => (
            <motion.article
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="border-b border-gray-800 py-7 md:px-6 md:odd:border-r lg:border-b-0 lg:border-r lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
            >
              <span className="text-sm font-black text-teal-400">{step.number}</span>
              <h3 className="mt-5 text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">{step.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
