/**
 * أداة ضغط الصور تلقائياً قبل الرفع
 * تحافظ على جودة ممتازة مع تقليص الحجم بشكل كبير
 */

interface CompressOptions {
    /** الحد الأقصى للعرض (px) */
    maxWidth?: number;
    /** الحد الأقصى للارتفاع (px) */
    maxHeight?: number;
    /** جودة الصورة (0.0 - 1.0) */
    quality?: number;
    /** نوع الإخراج */
    outputType?: "image/webp" | "image/jpeg" | "image/png";
    /** الحد الأقصى لحجم الملف بالبايت */
    maxSizeBytes?: number;
}

const AVATAR_OPTIONS: CompressOptions = {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.85,
    outputType: "image/webp",
    maxSizeBytes: 150 * 1024, // 150KB
};

const COVER_OPTIONS: CompressOptions = {
    maxWidth: 1200,
    maxHeight: 600,
    quality: 0.82,
    outputType: "image/webp",
    maxSizeBytes: 300 * 1024, // 300KB
};

/**
 * يحمّل الصورة من ملف إلى HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve(img);
        };
        img.onerror = () => reject(new Error("فشل تحميل الصورة"));
        img.src = URL.createObjectURL(file);
    });
}

/**
 * يحسب الأبعاد الجديدة مع الحفاظ على النسبة
 */
function calculateDimensions(
    width: number,
    height: number,
    maxW: number,
    maxH: number
): { width: number; height: number } {
    if (width <= maxW && height <= maxH) return { width, height };

    const ratio = Math.min(maxW / width, maxH / height);
    return {
        width: Math.round(width * ratio),
        height: Math.round(height * ratio),
    };
}

/**
 * يرسم الصورة على Canvas ويُصدّرها كـ Blob
 */
function canvasToBlob(
    img: HTMLImageElement,
    width: number,
    height: number,
    quality: number,
    type: string
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context غير متاح"));

        // تحسين الرسم
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error("فشل إنشاء الصورة المضغوطة"));
            },
            type,
            quality
        );
    });
}

/**
 * ضغط الصورة مع إعادة المحاولة بجودة أقل إذا تجاوز الحد
 */
async function compressWithRetry(
    img: HTMLImageElement,
    width: number,
    height: number,
    options: Required<Pick<CompressOptions, "quality" | "outputType" | "maxSizeBytes">>
): Promise<Blob> {
    let quality = options.quality;
    const minQuality = 0.4;
    const step = 0.08;

    while (quality >= minQuality) {
        const blob = await canvasToBlob(img, width, height, quality, options.outputType);
        if (blob.size <= options.maxSizeBytes || quality <= minQuality) {
            return blob;
        }
        quality -= step;
    }

    // آخر محاولة بأقل جودة
    return canvasToBlob(img, width, height, minQuality, options.outputType);
}

/**
 * يضغط ملف صورة ويعيد ملف جديد بحجم أصغر وجودة ممتازة
 * 
 * @param file - ملف الصورة الأصلي
 * @param type - نوع الصورة: 'avatar' | 'cover'
 * @returns ملف مضغوط جاهز للرفع
 * 
 * @example
 * ```ts
 * const compressed = await compressImage(file, 'avatar');
 * // compressed.size سيكون أصغر بكثير
 * ```
 */
export async function compressImage(
    file: File,
    type: "avatar" | "cover"
): Promise<File> {
    // إذا كان الملف صغير أصلاً، لا داعي للضغط
    const opts = type === "avatar" ? AVATAR_OPTIONS : COVER_OPTIONS;
    const maxSize = opts.maxSizeBytes!;

    if (file.size <= maxSize) {
        return file;
    }

    try {
        const img = await loadImage(file);
        const { width, height } = calculateDimensions(
            img.width,
            img.height,
            opts.maxWidth!,
            opts.maxHeight!
        );

        const blob = await compressWithRetry(img, width, height, {
            quality: opts.quality!,
            outputType: opts.outputType!,
            maxSizeBytes: maxSize,
        });

        // إنشاء اسم ملف جديد بامتداد webp
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const newFile = new File([blob], `${baseName}.webp`, {
            type: opts.outputType,
            lastModified: Date.now(),
        });

        // Log لتصحيح الأخطاء
        const ratio = ((1 - newFile.size / file.size) * 100).toFixed(0);
        console.log(
            `[ImageCompress] ${type}: ${formatSize(file.size)} → ${formatSize(newFile.size)} (−${ratio}%) | ${img.width}×${img.height} → ${width}×${height}`
        );

        return newFile;
    } catch (error) {
        console.warn("[ImageCompress] فشل الضغط، سيتم رفع الصورة الأصلية:", error);
        return file;
    }
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
