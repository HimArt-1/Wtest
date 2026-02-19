// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — صلاحية الوصول لـ "تصميم قطعة"
//  أي مستخدم مسجّل (بعد التسجيل) يمكنه الدخول للاستوديو والأداة
// ═══════════════════════════════════════════════════════════

"use server";

import { currentUser } from "@clerk/nextjs/server";

/**
 * يتحقق من أن المستخدم الحالي مسجّل؛ أي شخص تسجّل يمكنه استخدام "تصميم قطعة" والاستوديو.
 */
export async function canAccessDesignPiece(): Promise<{
    allowed: boolean;
    reason?: "not_signed_in" | "approved";
}> {
    const user = await currentUser();
    if (!user) {
        return { allowed: false, reason: "not_signed_in" };
    }
    return { allowed: true, reason: "approved" };
}
