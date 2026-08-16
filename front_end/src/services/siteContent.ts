import { ApiResponseSingle } from "@/lib/apiTypes";
import { SiteContent, SiteContentRecord } from "@/lib/siteContent";

import api from "./api";


export const getSiteContent = async (): Promise<SiteContentRecord> => {
  const response = await api.get<ApiResponseSingle<SiteContentRecord>>("/site-content/");
  return response.data.data;
};

export const updateSiteContent = async (content: SiteContent): Promise<SiteContentRecord> => {
  const response = await api.put<ApiResponseSingle<SiteContentRecord>>("/site-content/", { content });
  return response.data.data;
};
