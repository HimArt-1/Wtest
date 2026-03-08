// ═══════════════════════════════════════════════════════════
//  وشّى | WASHA — تحميل التصميم (PNG / PDF)
//  عميل فقط — رسم الصورة وتحميلها
// ═══════════════════════════════════════════════════════════

/**
 * تحميل صورة التصميم كـ PNG بجودة عالية (للطباعة).
 * يمكن استبداله لاحقاً بتوليد PDF من السيرفر.
 */
export async function downloadDesignAsPng(imageUrl: string, filename = "wusha-design") {
  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("فشل تحميل الصورة"));
    img.src = imageUrl;
  });

  const dpi = 300;
  const scale = dpi / 96;
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png", 1.0));
  if (!blob) throw new Error("فشل إنشاء الملف");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}-${Date.now()}.png`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * تحميل كـ PDF (صفحة واحدة، صورة فقط — جاهز للطباعة).
 * إن jsPDF غير متوفر نحمّل PNG عالي الجودة.
 */
export async function downloadDesignAsPdf(imageUrl: string, filename = "wusha-design") {
  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("فشل تحميل الصورة"));
    img.src = imageUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    await downloadDesignAsPng(imageUrl, filename);
    return;
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");

  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / (canvas.width * 0.26), pageH / (canvas.height * 0.26)) * 0.95;
    const w = canvas.width * 0.26 * ratio;
    const h = canvas.height * 0.26 * ratio;
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;

    doc.addImage(dataUrl, "PNG", x, y, w, h);
    doc.save(`${filename}-${Date.now()}.pdf`);
  } catch {
    await downloadDesignAsPng(imageUrl, filename);
  }
}
