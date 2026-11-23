"use client";

import { useRef, useState } from "react";

import {
  compressImageForUpload,
  formatFileSize,
  MAX_SOURCE_IMAGE_BYTES,
  MAX_UPLOAD_IMAGE_BYTES,
} from "@/lib/imageCompress";

import { useAdminToast } from "./AdminToastProvider";

export default function ImageFileInput({
  file,
  onChange,
  accept = "image/png,image/jpeg,image/gif,image/webp",
  maxDimension = 1920,
  quality = 0.82,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxDimension?: number;
  quality?: number;
}) {
  const notify = useAdminToast();
  const [isCompressing, setIsCompressing] = useState(false);
  const requestIdRef = useRef(0);

  const selectFile = async (candidate?: File) => {
    const requestId = ++requestIdRef.current;

    if (!candidate) {
      setIsCompressing(false);
      onChange(null);
      return;
    }

    const acceptedTypes = accept.split(",").map((item) => item.trim());
    if (!acceptedTypes.includes(candidate.type)) {
      notify("Format gambar tidak didukung. Gunakan PNG, JPG, GIF, atau WebP.", "error");
      return;
    }

    if (candidate.size > MAX_SOURCE_IMAGE_BYTES) {
      notify("Ukuran gambar sumber maksimal 20 MB.", "error");
      return;
    }

    setIsCompressing(true);
    try {
      const optimized = await compressImageForUpload(candidate, {
        maxDimension,
        quality,
      });
      if (requestId !== requestIdRef.current) return;

      if (optimized.size > MAX_UPLOAD_IMAGE_BYTES) {
        notify("Ukuran gambar masih melebihi 5 MB setelah kompresi.", "error");
        return;
      }

      onChange(optimized);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsCompressing(false);
      }
    }
  };

  return (
    <div
      className="rounded-lg border border-dashed border-editorial-line-strong p-4"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void selectFile(event.dataTransfer.files[0]);
      }}
    >
      <label className="block text-sm text-editorial-muted">
        Pilih atau seret gambar ke sini (otomatis dikompres ke WebP)
        <input
          type="file"
          accept={accept}
          onChange={(event) => {
            void selectFile(event.target.files?.[0]);
          }}
          className="mt-2 block w-full text-sm text-editorial-ink"
        />
      </label>
      {isCompressing && (
        <p className="mt-2 text-xs text-editorial-muted">Mengompres gambar ke WebP...</p>
      )}
      {!isCompressing && file && (
        <p className="mt-2 break-all text-xs text-editorial-technical">
          {file.name} ({formatFileSize(file.size)})
        </p>
      )}
    </div>
  );
}
