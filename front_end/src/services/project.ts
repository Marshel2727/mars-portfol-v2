import api from "./api";
import { Project } from "@/types";
// ✅ DRY: Mengganti interface lokal ProjectResponseSingle & ProjectResponseArray
import { ApiResponseSingle, ApiResponseArray } from "@/lib/apiTypes";

export const getAllProjects = async (): Promise<Project[]> => {
  const response = await api.get<ApiResponseArray<Project>>("/projects/");
  return response.data.data;
};

export const getProjectById = async (id: number): Promise<Project> => {
  const response = await api.get<ApiResponseSingle<Project>>(`/projects/${id}`);
  return response.data.data;
};

export const createProject = async (formData: FormData): Promise<Project> => {
  const response = await api.post<ApiResponseSingle<Project>>("/projects/", formData);
  return response.data.data;
};

export const updateProject = async (id: number, formData: FormData): Promise<Project> => {
  const response = await api.put<ApiResponseSingle<Project>>(`/projects/${id}`, formData);
  return response.data.data;
};

export const deleteProject = async (id: number): Promise<boolean> => {
  const response = await api.delete<ApiResponseSingle<Project>>(`/projects/${id}`);
  return response.data.status === "success";
};
