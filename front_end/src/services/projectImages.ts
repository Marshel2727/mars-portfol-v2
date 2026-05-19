import api from "./api";
import { ProjectImage } from "@/types";
// ✅ DRY: Mengganti interface lokal ProjectImageResponse
import { ApiResponseSingle } from "@/lib/apiTypes";

export const uploadProjectImage = async (formData: FormData): Promise<ProjectImage> => {
  const response = await api.post<ApiResponseSingle<ProjectImage>>("/project-images/", formData);
  return response.data.data;
};

export const deleteProjectImage = async (imageId: number): Promise<boolean> => {
  const response = await api.delete<ApiResponseSingle<ProjectImage>>(`/project-images/${imageId}`);
  return response.status === 200;
};
