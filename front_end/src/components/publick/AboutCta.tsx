import Link from "next/link";

import { AboutProfile } from "@/types";


export default function AboutCta({ profile }: { profile?: AboutProfile }) {
  return (
    <section className="border-t border-gray-800 bg-gray-950/45 py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 lg:flex-row lg:items-center lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase text-teal-400">Mari Berkolaborasi</p>
          <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            Punya ide atau masalah yang ingin diselesaikan?
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-400">
            Saya terbuka untuk diskusi project, kolaborasi, dan kesempatan untuk membangun solusi digital yang bermanfaat.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {profile?.cv_url && (
            <a
              href={profile.cv_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-gray-600 bg-gray-800 px-6 py-3 text-center font-semibold text-white transition hover:bg-gray-700"
            >
              Lihat CV
            </a>
          )}
          <Link
            href="/contact"
            className="rounded-lg bg-teal-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-teal-500"
          >
            Hubungi Saya
          </Link>
        </div>
      </div>
    </section>
  );
}
