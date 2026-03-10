// ═══════════════════════════════════════════════════════════
//  وشّى | WASHA — Ensure Profile
//  إنشاء ملف subscriber تلقائياً عند أول دخول لمستخدم Clerk
// ═══════════════════════════════════════════════════════════

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

export type EnsuredProfile = {
    id: string;
    clerk_id: string;
    display_name: string;
    username: string;
    role: string;
    avatar_url: string | null;
    bio: string | null;
    wushsha_level: number | null;
    is_verified: boolean;
};

/**
 * يتأكد من وجود ملف شخصي في Supabase للمستخدم الحالي.
 * إذا لم يكن موجوداً، يُنشئ واحداً بدور subscriber تلقائياً.
 * يُرجع الملف الشخصي أو null إذا لم يكن المستخدم مسجّل دخول.
 */
export async function ensureProfile(): Promise<EnsuredProfile | null> {
    try {
        const user = await currentUser();
        if (!user) return null;

        const supabase = getAdminSupabase();
        if (!supabase) return null;

        const { data: existing } = await supabase
            .from("profiles")
            .select("id, clerk_id, display_name, username, role, avatar_url, bio, wushsha_level, is_verified")
            .eq("clerk_id", user.id)
            .maybeSingle();

        if (existing) return existing as EnsuredProfile;

        const displayName =
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.username ||
            "مستخدم وشّى";

        const baseUsername = (
            user.username ||
            user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
            "user"
        )
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "_")
            .slice(0, 20);

        const username = `${baseUsername}_${Date.now().toString(36)}`;

        const { data: created, error } = await supabase
            .from("profiles")
            .insert({
                clerk_id: user.id,
                display_name: displayName,
                username,
                role: "subscriber",
                avatar_url: user.imageUrl || null,
            })
            .select("id, clerk_id, display_name, username, role, avatar_url, bio, wushsha_level, is_verified")
            .single();

        if (error) {
            if (error.code === "23505") {
                const { data: retry } = await supabase
                    .from("profiles")
                    .select("id, clerk_id, display_name, username, role, avatar_url, bio, wushsha_level, is_verified")
                    .eq("clerk_id", user.id)
                    .maybeSingle();
                return retry as EnsuredProfile | null;
            }
            console.error("[ensureProfile] Insert error:", error);
            return null;
        }

        return created as EnsuredProfile;
    } catch (err) {
        console.error("[ensureProfile]", err);
        return null;
    }
}
