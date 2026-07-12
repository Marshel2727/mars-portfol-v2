import api from "./api";
import Cookies from "js-cookie";
import { User } from "@/types";

export interface LoginResponse {
  status: string;
  message: string;
  data: User;
  access_token: string;
}

// ✅ BUG FIX: Menghapus try/catch yang langsung re-throw (tidak berguna, hanya
// menambah boilerplate). Error sekarang langsung propagate ke pemanggil.
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", { email, password });

  if (response.data.access_token) {
    const expiriesAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 jam
    Cookies.set("access_token", response.data.access_token, { expires: expiriesAt, sameSite: "strict", secure: window.location.protocol === "https:" });
  }

  return response.data;
};

export const logout = () => {
  Cookies.remove("access_token");
};

export const isAuthenticated = (): boolean => {
  return !!Cookies.get("access_token");
};
