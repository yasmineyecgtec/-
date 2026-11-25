import { MAX_IMAGE_DATA_URL_LENGTH } from '../types';

const TARGET_MAX_CHARS = 380000;
const MAX_DIMENSION = 840;

export async function compressImageFile(file: File): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  approxBytes: number;
}> {
  if (!file.type.startsWith('image/')) {
    throw new Error('請選擇圖片檔案（JPG、PNG 或 WebP）。');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('無法讀取圖片內容，請改用其他照片。'));
      el.src = objectUrl;
    });

    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    let targetW = Math.max(1, Math.round(img.width * scale));
    let targetH = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('瀏覽器不支援圖片壓縮處理。');
    }

    const qualities = [0.8, 0.68, 0.56, 0.44];
    for (let attempt = 0; attempt < qualities.length; attempt++) {
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL('image/jpeg', qualities[attempt]);
      if (dataUrl.length <= TARGET_MAX_CHARS) {
        return {
          dataUrl,
          width: targetW,
          height: targetH,
          approxBytes: Math.round((dataUrl.length * 3) / 4),
        };
      }
      targetW = Math.max(320, Math.round(targetW * 0.8));
      targetH = Math.max(320, Math.round(targetH * 0.8));
    }

    canvas.width = targetW;
    canvas.height = targetH;
    ctx.drawImage(img, 0, 0, targetW, targetH);
    const fallbackUrl = canvas.toDataURL('image/jpeg', 0.38);
    if (fallbackUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
      throw new Error('圖片檔案過大，請選擇解析度較低的照片再試一次。');
    }

    return {
      dataUrl: fallbackUrl,
      width: targetW,
      height: targetH,
      approxBytes: Math.round((fallbackUrl.length * 3) / 4),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
