// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — صلاحية الوصول لـ "تصميم قطعة"
//  لا يمكن الدخول إلا بعد تسجيل اشتراك وقبول من الإدارة
//  الأدمن والوشّاي: مسموح دائماً | الباقي: يحتاج طلب مقبول
// ═══════════════════════════════════════════════════════════

"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
    );
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
