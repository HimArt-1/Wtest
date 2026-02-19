"use server";

import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";

// ─── مزوّد التوليد: Replicate أو Gemini (Imagen 3) ────────
// ضبط في .env: IMAGE_PROVIDER=replicate | gemini (اختياري، الافتراضي replicate إن وُجد المفتاح)
const IMAGE_PROVIDER = (process.env.IMAGE_PROVIDER || "replicate").toLowerCase();
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const FLUX_SCHNELL = "black-forest-labs/flux-schnell";
const FLUX_IMG2IMG = "bxclib2/flux_img2img"; // صورة → صورة
const REPLICATE_WAIT = 120; // ثواني انتظار أقصى
const IMAGEN_MODEL = "imagen-3.0-generate-002";

interface GenerateImageResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
}

export async function generateImage(prompt: string, style: string): Promise<GenerateImageResult> {
    try {
        const fullPrompt = `${style} style: ${prompt}. High quality, detailed.`;

        if (isGeminiEnabled()) {
            const dataUrl = await runGeminiImagen(fullPrompt);
            if (dataUrl) return { success: true, imageUrl: dataUrl };
        }
        if (isReplicateEnabled()) {
            const out = await runReplicatePredictions({
                version: FLUX_SCHNELL,
                input: { prompt: fullPrompt },
            });
            if (out?.urls?.[0]) return { success: true, imageUrl: out.urls[0] };
        }

        // لا مفتاح: محاكاة للتطوير
        console.log("Mocking AI Generation for:", prompt);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return {
            success: true,
            imageUrl: "https://images.unsplash.com/photo-1633511090164-b43840ea1607?w=1024&q=80",
        };
    } catch (error) {
        console.error("AI Generation Error:", error);
        return { success: false, error: "فشل التوليد" };
    }
}

// ─── تصميم قطعة: توليد تصميم جاهز للطباعة ─────────────────

export interface GenerateDesignForPrintInput {
    method: "from_image" | "from_text";
    prompt: string;
    styleId: string;
    colorIds?: string[];
    imageBase64?: string | null;
}

/** هل مزوّد التوليد الحالي هو Gemini؟ */
function isGeminiEnabled(): boolean {
    return IMAGE_PROVIDER === "gemini" && !!GEMINI_API_KEY;
}

/** هل مزوّد التوليد الحالي هو Replicate؟ */
function isReplicateEnabled(): boolean {
    return !!REPLICATE_API_TOKEN;
}

/**
 * توليد صورة عبر Gemini (Imagen 3). يرجع data URL للصورة.
 * Imagen نص→صورة فقط (لا يدعم صورة مرجعية).
 */
async function runGeminiImagen(prompt: string): Promise<string | null> {
    if (!GEMINI_API_KEY) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "x-goog-api-key": GEMINI_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1 },
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error("Gemini Imagen API error:", res.status, err);
        return null;
    }

    const data = (await res.json()) as {
        predictions?: Array<{
            bytesBase64Encoded?: string;
            mimeType?: string;
        }>;
    };
    const pred = data.predictions?.[0];
    const b64 = pred?.bytesBase64Encoded;
    if (!b64) return null;
    const mime = pred?.mimeType || "image/png";
    return `data:${mime};base64,${b64}`;
}

/**
 * تشغيل نموذج على Replicate (نص → صورة).
 * يدعم Prefer: wait للانتظار حتى انتهاء التوليد.
 */
async function runReplicatePredictions(params: {
    version: string;
    input: Record<string, unknown>;
}): Promise<{ urls?: string[] } | null> {
    if (!REPLICATE_API_TOKEN) return null;

    const res = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json",
            Prefer: `wait=${REPLICATE_WAIT}`,
        },
        body: JSON.stringify({
            version: params.version,
            input: params.input,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error("Replicate API error:", res.status, err);
        throw new Error(err || "Replicate request failed");
    }

    const data = (await res.json()) as {
        status?: string;
        output?: string | string[];
        error?: string;
    };

    if (data.status !== "succeeded") {
        throw new Error(data.error || "التوليد لم يكتمل");
    }

    const output = data.output;
    if (Array.isArray(output)) {
        const urls = output.filter((u): u is string => typeof u === "string");
        return { urls };
    }
    if (typeof output === "string") {
        return { urls: [output] };
    }
    return null;
}

/**
 * رفع صورة (base64) إلى Supabase Storage وإرجاع رابط عام.
 * يستخدم Admin (Service Role) لتفادي سياسات RLS على الرفع من السيرفر.
 */
async function uploadImageToStorage(base64Data: string): Promise<string | null> {
    let supabase;
    try {
        supabase = getSupabaseAdminClient();
    } catch {
        supabase = getSupabaseServerClient();
    }
    const bucket = "designs";
    const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) return null;

    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const buffer = Buffer.from(match[2], "base64");
    const path = `temp/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
        contentType: `image/${ext}`,
        upsert: false,
    });

    if (error) {
        console.error("Upload design image error:", error.message);
        return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData?.publicUrl ?? null;
}

export async function generateDesignForPrint(
    input: GenerateDesignForPrintInput
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
        const stylePrompt = input.styleId ? `Style: ${input.styleId}. ` : "";
        const colorPrompt =
            input.colorIds?.length ? `Colors: ${input.colorIds.join(", ")}. ` : "";
        const qualitySuffix =
            " Print-ready, no background, transparent or white background, suitable for apparel printing, high resolution, clean edges.";
        const fullPrompt = `${stylePrompt}${colorPrompt}${input.prompt}${qualitySuffix}`;

        // مسار «من صورة»: يحتاج img2img — Replicate فقط يدعمه حالياً
        const needImg2Img = input.method === "from_image" && !!input.imageBase64;
        let imageInput: string | undefined;

        if (needImg2Img && input.imageBase64) {
            if (input.imageBase64.length > 250 * 1024) {
                const uploaded = await uploadImageToStorage(input.imageBase64);
                imageInput = uploaded ?? undefined;
            } else {
                imageInput = input.imageBase64;
            }
        }

        if (imageInput && isReplicateEnabled()) {
            const imgOut = await runReplicatePredictions({
                version: FLUX_IMG2IMG,
                input: { prompt: fullPrompt, image: imageInput },
            });
            if (imgOut?.urls?.[0]) return { success: true, imageUrl: imgOut.urls[0] };
        }

        // نص → صورة: Gemini (Imagen) أو Replicate (FLUX)
        if (isGeminiEnabled()) {
            const dataUrl = await runGeminiImagen(fullPrompt);
            if (dataUrl) return { success: true, imageUrl: dataUrl };
        }
        if (isReplicateEnabled()) {
            const out = await runReplicatePredictions({
                version: FLUX_SCHNELL,
                input: { prompt: fullPrompt },
            });
            if (out?.urls?.[0]) return { success: true, imageUrl: out.urls[0] };
        }

        if (isGeminiEnabled() || isReplicateEnabled()) {
            return { success: false, error: "لم يتم توليد صورة، جرّب مرة أخرى" };
        }

        // لا مفتاح: محاكاة للتطوير
        await new Promise((r) => setTimeout(r, 3500));
        return {
            success: true,
            imageUrl:
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&q=80",
        };
    } catch (err) {
        console.error("generateDesignForPrint:", err);
        const message = err instanceof Error ? err.message : "فشل التوليد، جرّب مرة أخرى";
        return { success: false, error: message };
    }
}
