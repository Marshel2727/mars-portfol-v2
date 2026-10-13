"use client";

import { useAdminToast } from "./AdminToastProvider";

export default function ImageFileInput({ file, onChange, accept = "image/png,image/jpeg,image/gif,image/webp" }: {
  file: File | null; onChange: (file: File | null) => void; accept?: string;
}) {
  const notify = useAdminToast();
  const selectFile = (candidate?: File) => {
    if (!candidate) { onChange(null); return; }
    if (!accept.split(",").includes(candidate.type) || candidate.size > 5 * 1024 * 1024) {
      notify("Pilih gambar dengan format yang didukung, maksimal 5 MB.", "error");
      return;
    }
    onChange(candidate);
  };
  return <div className="rounded-lg border border-dashed border-editorial-line-strong p-4"
    onDragOver={(event) => event.preventDefault()}
    onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]); }}>
    <label className="block text-sm text-editorial-muted">
      Pilih atau seret gambar ke sini (maksimal 5 MB)
      <input type="file" accept={accept} onChange={(event) => selectFile(event.target.files?.[0])}
        className="mt-2 block w-full text-sm text-editorial-ink" />
    </label>
    {file && <p className="mt-2 break-all text-xs text-editorial-technical">{file.name}</p>}
  </div>;
}
