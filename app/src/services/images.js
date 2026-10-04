import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";
import { getActiveHouseholdId } from "./households";

function removeNearWhiteBackground(sourceCanvas) {
  const context = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const image = context.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const { data, width, height } = image;
  const threshold = 244;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];

    if (red >= threshold && green >= threshold && blue >= threshold) {
      data[index + 3] = 0;
    }
  }

  context.putImageData(image, 0, 0);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];

      if (alpha > 12) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < 0) return sourceCanvas;

  const padding = Math.max(8, Math.round(Math.max(width, height) * 0.04));
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = Math.min(width - cropX, maxX - minX + 1 + padding * 2);
  const cropHeight = Math.min(height - cropY, maxY - minY + 1 + padding * 2);

  const output = document.createElement("canvas");
  output.width = cropWidth;
  output.height = cropHeight;
  output.getContext("2d").drawImage(
    sourceCanvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  return output;
}

async function prepareImage(file) {
  const bitmap = await createImageBitmap(file);
  const maxSize = 1200;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const cleaned = removeNearWhiteBackground(canvas);

  return new Promise((resolve, reject) => {
    cleaned.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("IMAGE_PROCESSING_FAILED"))),
      "image/webp",
      0.88,
    );
  });
}

export async function uploadProductImage(file, barcode) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("INVALID_IMAGE");
  }

  const householdId = getActiveHouseholdId();

  if (!householdId) {
    throw new Error("HOUSEHOLD_REQUIRED");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const blob = await prepareImage(file);
  const imageRef = ref(
    storage,
    `households/${householdId}/products/${barcode}-${Date.now()}.webp`,
  );

  await uploadBytes(imageRef, blob, {
    contentType: "image/webp",
    cacheControl: "public,max-age=31536000,immutable",
  });

  return getDownloadURL(imageRef);
}
