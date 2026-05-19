// [BARU] ✅ DRY: Fungsi getImageUrl dipindahkan ke sini agar tidak duplikat
// di GallerySection.tsx, ProjectsSection.tsx, dan ProjectGalleryModal.tsx
export const getImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:5000";
  return `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
};
