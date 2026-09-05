import api from "./api";
import { User } from "@/types";

export interface LoginResponse {
  status: string;
  message: string;
  data: User;
}

// ✅ BUG FIX: Menghapus try/catch yang langsung re-throw (tidak berguna, hanya
// menambah boilerplate). Error sekarang langsung propagate ke pemanggil.
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", { email, password });

  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post("/auth/logout");
};
