"use client";

import { useEffect } from "react";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  isVisible: boolean;
  onClose: () => void;
  durationMs?: number;
}

export default function Toast({
  message,
  type = "success",
  isVisible,
  onClose,
  durationMs = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [isVisible, durationMs, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`toast-container toast-container--${type}`} role="status" aria-live="polite">
      <div className="toast-icon">
        {type === "success" && "✓"}
        {type === "error" && "✕"}
        {type === "info" && "ℹ"}
      </div>
      <span className="toast-message">{message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Tutup notifikasi">
        ×
      </button>
    </div>
  );
}
