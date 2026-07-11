import { ApiResponseSingle } from "@/lib/apiTypes";
import { AboutProfile } from "@/types";
import api from "./api";


export const getAboutProfile = async (): Promise<AboutProfile> => {
  const response = await api.get<ApiResponseSingle<AboutProfile>>("/about/");
  return response.data.data;
};

export const updateAboutProfile = async (formData: FormData): Promise<AboutProfile> => {
  const response = await api.put<ApiResponseSingle<AboutProfile>>("/about/", formData);
  return response.data.data;
};
