import { Suspense } from "react";

import ContactSection from "@/components/publick/ContactSection";
import { EditorialPage } from "@/components/publick/EditorialUI";

export default function ContactPage() {
  return (
    <EditorialPage>
      <Suspense fallback={<div className="editorial-shell" style={{ padding: 48 }}>Memuat form...</div>}>
        <ContactSection />
      </Suspense>
    </EditorialPage>
  );
}
