"use client";

import useSWR from "swr";

import EditorialCertificates from "@/components/public/EditorialCertificates";
import { EditorialPage } from "@/components/public/EditorialUI";
import { getAllCertificates } from "@/services/certificates";

export default function CertificatesContent() {
  const certificatesRequest = useSWR("/certificates/", getAllCertificates);

  return (
    <EditorialPage>
      <EditorialCertificates
        certificates={Array.isArray(certificatesRequest.data) ? certificatesRequest.data : []}
        certificatesLoading={certificatesRequest.isLoading && !certificatesRequest.data}
        certificatesError={Boolean(certificatesRequest.error) && !certificatesRequest.data}
      />
    </EditorialPage>
  );
}
