"use server";

import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";
import { profileSchema, type ProfileFormData } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { STORAGE_BUCKETS } from "@/lib/constants";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type ProfileActionState = {
    message?: string;
    errors?: {
        [key in keyof ProfileFormData]?: string[];
    };
    success?: boolean;
};

export async function updateProfile(
    prevState: ProfileActionState,
    formData: FormData
): Promise<ProfileActionState> {
    const clerkUser = await currentUser();
    if (!clerkUser) {
        return { success: false, message: "يجب تسجيل الدخول أولاً" };
    }

    const supabase = getSupabaseServerClient();
    const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", clerkUser.id)
        .single();
    if (!existingProfile) {
        return { success: false, message: "الملف الشخصي غير موجود. تواصل مع الإدارة لتفعيل حسابك." };
    }

    // 2. Parse and Validate Data
    // Extract social links manually since FormData is flat
    const rawData = {
        display_name: formData.get("display_name"),
        username: formData.get("username"),
        bio: formData.get("bio"),
        website: formData.get("website"),
        // If avatar/cover URLs are sent as hidden fields after upload
        avatar_url: formData.get("avatar_url"),
        cover_url: formData.get("cover_url"),
        social_links: {
            instagram: formData.get("social.instagram"),
            twitter: formData.get("social.twitter"),
            youtube: formData.get("social.youtube"),
            behance: formData.get("social.behance"),
            dribbble: formData.get("social.dribbble"),
        }
    };

    // Clean up empty strings for optional URL fields to match schema expectations if needed,
    // although zod `urlOptional` handles empty string or undefined.

    const validatedFields = profileSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors as any,
            message: "البيانات المدخلة غير صحيحة",
        };
    }

    const { data } = validatedFields;

    // 3. Update Database (by clerk_id)
    try {
        const { error } = await (supabase
            .from("profiles") as any)
            .update({
                display_name: data.display_name,
                username: data.username,
                bio: data.bio ?? null,
                website: data.website ?? null,
                avatar_url: data.avatar_url ?? null,
                cover_url: data.cover_url ?? null,
                social_links: data.social_links ?? null,
                updated_at: new Date().toISOString(),
            })
            .eq("clerk_id", clerkUser.id);

        if (error) {
            console.error("Profile update error:", error);
            // Handle unique constraint on username
            if (error.code === "23505") { // Unique violation
                return {
                    success: false,
                    errors: { username: ["اسم المستخدم هذا مستخدم بالفعل"] },
                    message: "اسم المستخدم غير متاح",
                };
            }
            throw error;
        }

        revalidatePath("/studio/settings");
        revalidatePath("/account");

        return { success: true, message: "تم تحديث الملف الشخصي بنجاح" };

    } catch (error) {
        console.error("Server error:", error);
        return { success: false, message: "حدث خطأ أثناء حفظ البيانات" };
    }
}

// ─── UPLOAD PROFILE IMAGE (avatar or cover) ────────────────

export async function uploadProfileImage(
    formData: FormData,
    type: "avatar" | "cover"
): Promise<{ success: true; url: string } | { success: false; error: string }> {
    const clerkUser = await currentUser();
    if (!clerkUser) return { success: false, error: "يجب تسجيل الدخول أولاً" };

    const supabase = getSupabaseServerClient();
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", clerkUser.id)
        .single();

    if (!profile) return { success: false, error: "الملف الشخصي غير موجود" };

    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
        return { success: false, error: "لم يتم اختيار ملف" };
    }
    if (file.size > MAX_AVATAR_SIZE) {
        return { success: false, error: "حجم الملف يجب أن لا يتجاوز 2 ميجابايت" };
    }
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
        return { success: false, error: "نوع الملف غير مدعوم (PNG, JPG, WebP, GIF فقط)" };
    }

    const adminSupabase = getSupabaseAdminClient();
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${clerkUser.id}/${type}-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await adminSupabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .upload(fileName, buffer, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type,
        });

    if (error) {
        console.error("[uploadProfileImage]", error);
        return { success: false, error: error.message };
    }

    const { data: { publicUrl } } = adminSupabase.storage.from(STORAGE_BUCKETS.AVATARS).getPublicUrl(data.path);
    return { success: true, url: publicUrl };
}

import { type Profile } from "@/types/database";

export async function getProfile(): Promise<Profile | null> {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const supabase = getSupabaseServerClient();
    const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("clerk_id", clerkUser.id)
        .single();

    return data as Profile | null;
}
