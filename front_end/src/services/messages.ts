import api from "./api";
import { Message } from "@/types";
// ✅ DRY: Mengganti interface lokal MessageResponseSingle & MessageResponseArray
import { ApiResponseSingle, ApiResponseArray } from "@/lib/apiTypes";

export const getAllMessages = async (): Promise<Message[]> => {
  const response = await api.get<ApiResponseArray<Message>>("/messages/");
  return response.data.data;
};

export const getMessageById = async (id: number): Promise<Message> => {
  const response = await api.get<ApiResponseSingle<Message>>(`/messages/${id}`);
  return response.data.data;
};

export const createMessage = async (data: {
  name: string;
  email: string;
  content: string;
}): Promise<Message> => {
  const response = await api.post<ApiResponseSingle<Message>>("/messages/", data);
  return response.data.data;
};

export const markMessageAsRead = async (id: number): Promise<boolean> => {
  const response = await api.put(`/messages/${id}`);
  return response.status === 200;
};

export const deleteMessage = async (id: number): Promise<boolean> => {
  const response = await api.delete(`/messages/${id}`);
  return response.status === 200;
};
