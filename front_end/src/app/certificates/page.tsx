import type { Metadata } from "next";

import CertificatesContent from "@/components/public/CertificatesContent";
import PublicDataProvider from "@/components/public/PublicDataProvider";
import { siteUrl } from "@/lib/seo";
import { getPublicFallback } from "@/lib/serverPublicData";

export const metadata: Metadata = {
  title: "Sertifikat & Lisensi | Marshel",
  description:
    "Dokumentasi sertifikasi kompetensi, pelatihan teknis, lisensi, dan penghargaan di bidang pengembangan web, IoT, cloud, serta rekayasa sistem.",
  alternates: { canonical: `${siteUrl}/certificates` },
};

export default async function Page() {
  const fallback = await getPublicFallback(["/certificates/", "/about/", "/site-content/"]);
  return (
    <PublicDataProvider fallback={fallback}>
      <CertificatesContent />
    </PublicDataProvider>
  );
}
