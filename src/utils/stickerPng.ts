export async function downloadStickerSvgAsPng(
  svgElementId: string,
  filename: string,
  size = 1024
): Promise<void> {
  const svgEl = document.getElementById(svgElementId);
  if (!(svgEl instanceof SVGSVGElement)) {
    throw new Error('找不到貼紙向量圖檔，請稍後再試。');
  }

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(size));
  clone.setAttribute('height', String(size));
  clone.removeAttribute('class');

  const serializer = new XMLSerializer();
  const svgMarkup = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgMarkup], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('無法將貼紙轉換為 PNG 格式。'));
      image.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('瀏覽器不支援畫布匯出。');
    }
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('PNG 檔案產生失敗。'));
          }
        },
        'image/png',
        1
      );
    });

    const pngUrl = URL.createObjectURL(pngBlob);
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
