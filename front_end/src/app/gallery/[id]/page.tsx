import GallerySection from "@/components/publick/GallerySection";

// 1. Tambahkan 'async' di depan function
// 2. Ubah tipe data params menjadi Promise<{ id: string }>
export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  
  // 3. "Bongkar" (unwrap) Promise-nya dengan await
  const { id } = await params;

  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Sekarang id sudah aman untuk digunakan! */}
      <GallerySection projectId={Number(id)} />
    </div>
  );
}