/**
 * High-performance, zero-dependency client-side image compression utility.
 * Resizes large camera photos and converts them into optimized WebP/JPEG formats
 * before uploading to Supabase Storage, saving 90-98% bandwidth and storage.
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetMimeType?: "image/webp" | "image/jpeg" | "image/png";
}

/**
 * Compresses an image File using HTML5 Canvas in the browser.
 * If compression is unsupported or fails, safely returns the original file.
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  // Guard for non-browser or non-image environments
  if (typeof window === "undefined" || !file || !file.type.startsWith("image/")) {
    return file;
  }

  // SVG images or animated GIFs shouldn't be compressed via canvas
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  const {
    maxWidth = 900,
    maxHeight = 900,
    quality = 0.82,
    targetMimeType = "image/webp",
  } = options;

  return new Promise<File>((resolve) => {
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let { width, height } = img;

        // Calculate aspect-ratio-preserving target dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create offscreen canvas for resizing
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Apply high-quality interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw and scale image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Determine preferred export format (fallback to jpeg if webp not supported)
        const mime = targetMimeType === "image/webp" && isWebPSupported()
          ? "image/webp"
          : "image/jpeg";

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // If compressed blob is unexpectedly larger than original, keep original
            if (blob.size >= file.size) {
              resolve(file);
              return;
            }

            const extension = mime === "image/webp" ? "webp" : "jpg";
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const newFileName = `${baseName}.${extension}`;

            const compressedFile = new File([blob], newFileName, {
              type: mime,
              lastModified: Date.now(),
            });

            if (import.meta.env?.DEV) {
              const originalKB = (file.size / 1024).toFixed(1);
              const compressedKB = (compressedFile.size / 1024).toFixed(1);
              const savedPercent = (
                ((file.size - compressedFile.size) / file.size) *
                100
              ).toFixed(0);
              console.log(
                `📸 Compressed image: ${originalKB} KB → ${compressedKB} KB (${savedPercent}% saved, ${width}x${height})`,
              );
            }

            resolve(compressedFile);
          },
          mime,
          quality,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    } catch (e) {
      console.warn("Client-side image compression fallback to original file:", e);
      resolve(file);
    }
  });
}

function isWebPSupported(): boolean {
  try {
    const elem = document.createElement("canvas");
    if (elem.getContext && elem.getContext("2d")) {
      return elem.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    }
    return false;
  } catch {
    return false;
  }
}
