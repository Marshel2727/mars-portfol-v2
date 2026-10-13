"use client";

import { createContext, useContext, useMemo } from "react";
import useSWR from "swr";

import { DEFAULT_SITE_CONTENT, mergeSiteContent, SiteContent } from "@/lib/siteContent";
import { getSiteContent } from "@/services/siteContent";


const SiteContentContext = createContext<SiteContent>(DEFAULT_SITE_CONTENT);

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const { data } = useSWR("/site-content/", getSiteContent);
  const content = useMemo(() => mergeSiteContent(data?.content), [data?.content]);

  return (
    <SiteContentContext.Provider value={content}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
