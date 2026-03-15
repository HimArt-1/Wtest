// ═══════════════════════════════════════════════════════════
//  وشّى | WASHA — صلاحية الوصول لـ "تصميم قطعة"
//  لا يمكن الدخول إلا بعد تسجيل اشتراك وقبول من الإدارة
//  الأدمن والوشّاي: مسموح دائماً | الباقي: يحتاج طلب مقبول
// ═══════════════════════════════════════════════════════════

"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

function getSupabase() {
    try {
        return getSupabaseAdminClient();
    } catch {
        return null;
    }
}

const ALLOWED_ROLES = ["admin", "wushsha", "subscriber"];

/**
 * صلاحية التصميم:
 * - المشرف والوشّاي والمشترك: مسموح دائماً
 * - غير مسجّل الدخول: يُحوّل لتسجيل الدخول
 * - بدون ملف شخصي: يُطلب منه التسجيل
 */
export async function canAccessDesignPiece(): Promise<{
    allowed: boolean;
    reason?: "not_signed_in" | "guest_needs_approval" | "approved";
}> {
    const user = await currentUser();
    if (!user) {
        return { allowed: false, reason: "not_signed_in" };
    }

    const supabase = getSupabase();
    if (!supabase) {
        return { allowed: false, reason: "guest_needs_approval" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("clerk_id", user.id)
        .single();

    if (!profile) {
        return { allowed: false, reason: "guest_needs_approval" };
    }

    const role = profile.role as string;

    if (ALLOWED_ROLES.includes(role)) {
        return { allowed: true, reason: "approved" };
    }

    return { allowed: false, reason: "guest_needs_approval" };
}
