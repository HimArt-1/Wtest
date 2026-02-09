"use server";

import { getSupabaseServerClient } from "@/lib/supabase";
import { profileSchema, type ProfileFormData } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
    const supabase = getSupabaseServerClient();

    // 1. Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: "غير مصرح لك بالقيام بهذا الإجراء" };
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

    // 3. Update Database
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
            .eq("id", user.id);

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
        revalidatePath("/profile"); // Assuming there is a public profile page

        return { success: true, message: "تم تحديث الملف الشخصي بنجاح" };

    } catch (error) {
        console.error("Server error:", error);
        return { success: false, message: "حدث خطأ أثناء حفظ البيانات" };
    }
}

import { type Profile } from "@/types/database";

export async function getProfile(): Promise<Profile | null> {
    const supabase = getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return data as Profile | null;
}
