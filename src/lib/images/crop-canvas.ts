/**
 * Canvas utility for cropping and slicing high-resolution images for TrippyGo PDF Itineraries
 * Supports A4 portrait ratio (1:1.414) and 1:1 square ratio for day blocks.
 */

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates an HTMLImageElement and loads the image source asynchronously with CORS enabled
 */
export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    // Only set crossOrigin for remote HTTP(S) URLs to prevent CORS errors on Data URIs
    if (!url.startsWith("data:")) {
      image.setAttribute("crossOrigin", "anonymous");
    }
    image.src = url;
  });
}

/**
 * Returns a high-quality cropped image as a JPEG Data URI using HTML5 canvas
 *
 * @param imageSrc Source URL or Data URI of the image
 * @param pixelCrop Cropping box in source image pixel coordinates
 * @param maxDimension Maximum dimension (width or height) to prevent canvas memory blowup
 * @param quality JPEG compression quality (0.0 - 1.0)
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  maxDimension: number = 2000,
  quality: number = 0.90
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not acquire 2D canvas context for image cropping.");
  }

  // Calculate target output dimensions respecting maxDimension to stay crisp & performant
  let targetWidth = pixelCrop.width;
  let targetHeight = pixelCrop.height;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  // Ensure minimum dimensions
  targetWidth = Math.max(targetWidth, 100);
  targetHeight = Math.max(targetHeight, 100);

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw the cropped region onto the output canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return canvas.toDataURL("image/jpeg", quality);
}
