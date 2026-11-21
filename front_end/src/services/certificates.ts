import api from "./api";
import { Certificate } from "@/types";
import { ApiResponseSingle, ApiResponseArray } from "@/lib/apiTypes";

export const getAllCertificates = async (): Promise<Certificate[]> => {
  const response = await api.get<ApiResponseArray<Certificate>>("/certificates/");
  return response.data.data;
};

export const getCertificateById = async (id: number): Promise<Certificate> => {
  const response = await api.get<ApiResponseSingle<Certificate>>(`/certificates/${id}`);
  return response.data.data;
};

export const createCertificate = async (formData: FormData): Promise<Certificate> => {
  const response = await api.post<ApiResponseSingle<Certificate>>("/certificates/", formData);
  return response.data.data;
};

export const updateCertificate = async (id: number, formData: FormData): Promise<Certificate> => {
  const response = await api.put<ApiResponseSingle<Certificate>>(`/certificates/${id}`, formData);
  return response.data.data;
};

export const deleteCertificate = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/certificates/${id}`);
  return response.data.status === "success";
};
