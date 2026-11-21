"use client";

import { useState } from "react";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { getImageUrl } from "@/lib/utils";
import { getApiErrorMessage } from "@/services/api";
import { deleteCertificate } from "@/services/certificates";
import { Certificate } from "@/types";

interface CertificateListProps {
  certificates: Certificate[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit: (certificate: Certificate) => void;
}

export default function CertificateList({
  certificates,
  isLoading,
  onRefresh,
  onEdit,
}: CertificateListProps) {
  const notify = useAdminToast();
  const [certificateToDelete, setCertificateToDelete] = useState<Certificate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!certificateToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCertificate(certificateToDelete.id);
      notify(`Sertifikat "${certificateToDelete.title}" berhasil dihapus.`);
      setCertificateToDelete(null);
      onRefresh();
    } catch (error) {
      console.error("Gagal menghapus sertifikat", error);
      notify(getApiErrorMessage(error, "Gagal menghapus sertifikat."), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-editorial-line bg-editorial-surface p-6 shadow-[var(--shadow-editorial)]">
      <div className="mb-6 flex items-center justify-between border-b border-editorial-line pb-4">
        <h2 className="text-xl font-bold text-editorial-ink">Daftar Sertifikat &amp; Lisensi</h2>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-editorial-muted">Memuat data sertifikat...</div>
      ) : certificates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-editorial-line-strong bg-editorial-paper-deep py-12 text-center text-editorial-muted">
          Belum ada sertifikat yang ditambahkan.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-editorial-ink">
            <thead className="border-b border-editorial-line bg-editorial-paper-deep text-xs uppercase text-editorial-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Dokumen</th>
                <th className="px-4 py-3 font-semibold">Judul &amp; Kredensial</th>
                <th className="px-4 py-3 font-semibold">Penerbit &amp; Tanggal</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-editorial-line">
              {certificates.map((certificate) => (
                <tr
                  key={certificate.id}
                  className="transition-colors hover:bg-editorial-paper-deep"
                >
                  <td className="px-4 py-3">
                    {certificate.file_type === "pdf" ? (
                      <a
                        href={getImageUrl(certificate.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka dokumen PDF"
                        className="inline-flex h-12 w-14 items-center justify-center rounded border border-editorial-danger/30 bg-editorial-danger/10 text-xs font-bold text-editorial-danger transition hover:bg-editorial-danger hover:text-white"
                      >
                        PDF
                      </a>
                    ) : (
                      <img
                        src={getImageUrl(certificate.file_url)}
                        alt={certificate.title}
                        className="h-12 w-16 rounded border border-editorial-line-strong bg-editorial-paper-deep object-cover shadow-sm"
                      />
                    )}
                  </td>

                  <td className="max-w-xs break-words px-4 py-3">
                    <div className="font-semibold text-editorial-ink">{certificate.title}</div>
                    {certificate.credential_id && (
                      <div className="mt-1 font-mono text-xs text-editorial-muted">
                        ID: {certificate.credential_id}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-editorial-muted">
                      Urutan: {certificate.display_order ?? 0}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium text-editorial-ink">{certificate.issuer}</div>
                    {certificate.issue_date && (
                      <div className="mt-0.5 text-xs text-editorial-muted">
                        {certificate.issue_date}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-block rounded border border-editorial-technical/20 bg-editorial-technical/10 px-2.5 py-1 text-xs font-semibold text-editorial-technical">
                      {certificate.category || "Lainnya"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {certificate.is_featured ? (
                      <span className="inline-flex items-center rounded border border-editorial-accent/30 bg-editorial-accent/10 px-2.5 py-1 text-xs font-semibold text-editorial-accent-strong">
                        ★ Unggulan
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded border border-editorial-line bg-editorial-paper-deep px-2.5 py-1 text-xs text-editorial-muted">
                        Reguler
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(certificate)}
                        className="min-h-11 rounded-md border border-editorial-accent/20 bg-editorial-accent/10 px-3 py-1.5 text-xs font-semibold text-editorial-accent-strong shadow-sm transition-colors hover:bg-editorial-action hover:text-editorial-on-action"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setCertificateToDelete(certificate)}
                        className="min-h-11 rounded-md border border-editorial-danger/20 bg-editorial-danger/10 px-3 py-1.5 text-xs font-semibold text-editorial-danger shadow-sm transition-colors hover:bg-editorial-danger hover:text-white"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(certificateToDelete)}
        title="Hapus Sertifikat"
        message={`Apakah Anda yakin ingin menghapus sertifikat "${certificateToDelete?.title}"? File dokumen terkait juga akan dihapus permanen.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCertificateToDelete(null)}
      />
    </div>
  );
}
