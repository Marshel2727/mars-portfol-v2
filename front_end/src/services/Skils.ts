import api from "./api";
import { Skill } from "@/types";
// ✅ DRY: Mengganti interface lokal SkillResponseSingle & SkillResponseArray
import { ApiResponseSingle, ApiResponseArray } from "@/lib/apiTypes";

export const getAllSkill = async (): Promise<Skill[]> => {
  const response = await api.get<ApiResponseArray<Skill>>("/skills/");
  return response.data.data;
};

export const getSkillById = async (id: number): Promise<Skill> => {
  const response = await api.get<ApiResponseSingle<Skill>>(`/skills/${id}`);
  return response.data.data;
};

export const createSkill = async (formData: FormData): Promise<Skill> => {
  const response = await api.post<ApiResponseSingle<Skill>>("/skills/", formData);
  return response.data.data;
};

export const updateSkill = async (id: number, formData: FormData): Promise<Skill> => {
  const response = await api.put<ApiResponseSingle<Skill>>(`/skills/${id}`, formData);
  return response.data.data;
};

export const deleteSkill = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/skills/${id}`);
  return response.data.status === "success";
};
