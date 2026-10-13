import { Suspense } from "react";

import ContactSection from "@/components/public/ContactSection";
import { EditorialPage } from "@/components/public/EditorialUI";

export default function ContactPage() {
  return (
    <EditorialPage>
      <Suspense fallback={<div className="editorial-shell" style={{ padding: 48 }}>Memuat form...</div>}>
        <ContactSection />
      </Suspense>
    </EditorialPage>
  );
}
