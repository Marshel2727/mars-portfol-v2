import api from "./api";
import { ApiResponseSingle } from "@/lib/apiTypes";
import { VpsMetrics } from "@/types";

export const getVpsMetrics = async (fresh = false): Promise<VpsMetrics> => {
  const endpoint = fresh ? "/vps/metrics?fresh=1" : "/vps/metrics";
  const response = await api.get<ApiResponseSingle<VpsMetrics>>(endpoint);
  return response.data.data;
};
