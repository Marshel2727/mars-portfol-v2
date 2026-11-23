export const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_UPLOAD_IMAGE_BYTES = 5 * 1024 * 1024;

const RASTER_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const RASTER_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isRasterImageFile(file: File): boolean {
  if (file.type && RASTER_MIME_TYPES.has(file.type.toLowerCase())) {
    return true;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return RASTER_EXTENSIONS.has(ext);
}

function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(0, dot) : filename || "image";
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

async function decodeImage(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fall back to HTMLImageElement decoding below.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Image decode failed"));
      element.src = objectUrl;
    });
    return {
      source: img,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export async function compressImageForUpload(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  if (typeof document === "undefined" || !isRasterImageFile(file)) {
    return file;
  }

  const maxDimension = options.maxDimension ?? 1920;
  const quality = options.quality ?? 0.82;

  try {
    const decoded = await decodeImage(file);
    try {
      const { source, width, height } = decoded;
      if (width <= 0 || height <= 0) {
        return file;
      }

      const longestEdge = Math.max(width, height);
      const scale = longestEdge > maxDimension ? maxDimension / longestEdge : 1;
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));
      const resized = targetWidth < width || targetHeight < height;

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return file;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

      let blob = await canvasToBlob(canvas, "image/webp", quality);
      let outputExt = "webp";

      if (!blob || blob.type !== "image/webp") {
        blob = await canvasToBlob(canvas, "image/jpeg", quality);
        outputExt = "jpg";
      }

      if (!blob) {
        return file;
      }

      if (!resized && blob.size >= file.size && file.size <= MAX_UPLOAD_IMAGE_BYTES) {
        return file;
      }

      const baseName = stripExtension(file.name);
      return new File([blob], `${baseName}.${outputExt}`, {
        type: blob.type,
        lastModified: Date.now(),
      });
    } finally {
      decoded.cleanup();
    }
  } catch {
    return file;
  }
}
