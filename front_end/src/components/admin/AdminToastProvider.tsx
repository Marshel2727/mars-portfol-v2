"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Toast from "@/components/ui/Toast";

type Notify = (message: string, type?: "success" | "error") => void;
const ToastContext = createContext<Notify>(() => {});

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false, id: 0 });
  const notify = useCallback<Notify>((message, type = "success") => {
    setToast((current) => ({ message, type, isVisible: true, id: current.id + 1 }));
  }, []);
  return <ToastContext.Provider value={notify}>
    {children}
    <Toast key={toast.id} {...toast} onClose={() => setToast((current) => ({ ...current, isVisible: false }))} />
  </ToastContext.Provider>;
}

export const useAdminToast = () => useContext(ToastContext);
