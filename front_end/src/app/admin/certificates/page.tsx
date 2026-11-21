"use client";

import { useState } from "react";
import useSWR from "swr";
import { Certificate } from "@/types";
import { getAllCertificates } from "@/services/certificates";
import CertificateForm from "@/components/admin/certificates/CertificateForm";
import CertificateList from "@/components/admin/certificates/CertificateList";

export default function CertificateAdminPage() {
  const { data: rawCertificates, isLoading, mutate } = useSWR(
    "/certificates/",
    () => getAllCertificates()
  );
  const certificates = Array.isArray(rawCertificates) ? rawCertificates : [];
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [certificateToEdit, setCertificateToEdit] = useState<Certificate | null>(null);

  const handleAddNewCertificate = () => {
    setCertificateToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditCertificate = (certificate: Certificate) => {
    setCertificateToEdit(certificate);
    setIsFormOpen(true);
  };

  const handleSuccessForm = () => {
    setCertificateToEdit(null);
    setIsFormOpen(false);
    mutate();
  };

  const handleCancelForm = () => {
    setCertificateToEdit(null);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-editorial-ink">Kelola Sertifikat &amp; Lisensi</h1>

        <button
          type="button"
          onClick={handleAddNewCertificate}
          className="min-h-11 rounded-md bg-editorial-action px-4 py-2 font-medium text-editorial-on-action transition hover:bg-editorial-action-hover"
        >
          + Tambah Sertifikat
        </button>
      </div>

      {isFormOpen && (
        <CertificateForm
          key={certificateToEdit?.id ?? "new"}
          certificateToEdit={certificateToEdit}
          onCancel={handleCancelForm}
          onSuccess={handleSuccessForm}
        />
      )}

      <CertificateList
        certificates={certificates}
        isLoading={isLoading}
        onRefresh={mutate}
        onEdit={handleEditCertificate}
      />
    </div>
  );
}
