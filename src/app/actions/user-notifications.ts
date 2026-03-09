"use server";

import { createClient } from "@supabase/supabase-js";
import type { UserNotificationType, UserNotification } from "@/types/database";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Raw client for user_notifications (bypasses typed schema to avoid postgrest-js never-type issue)
function getRawClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
    );
}

export async function createUserNotification(data: {
    userId: string;
    type: UserNotificationType | string;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
}) {
    const supabase = getRawClient();
    const { error } = await supabase.from("user_notifications").insert({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || null,
        metadata: data.metadata || {},
    });

    if (error) {
        console.error("[createUserNotification]", error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function getUserNotifications(limit = 20) {
    const user = await currentUser();
    if (!user) return [];

    const supabase = getRawClient();

    // Resolve profile ID from clerk ID
    const { data: profile } = await supabase.from("profiles").select("id").eq("clerk_id", user.id).single();
    if (!profile) return [];

    const { data, error } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[getUserNotifications]", error.message);
        return [];
    }

    return (data || []) as UserNotification[];
}

export async function getUnreadUserNotificationsCount() {
    const user = await currentUser();
    if (!user) return 0;

    const supabase = getRawClient();

    const { data: profile } = await supabase.from("profiles").select("id").eq("clerk_id", user.id).single();
    if (!profile) return 0;

    const { count, error } = await supabase
        .from("user_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_read", false);

    if (error) {
        console.error("[getUnreadUserNotificationsCount]", error.message);
        return 0;
    }

    return count || 0;
}

export async function markUserNotificationRead(id: string) {
    const user = await currentUser();
    if (!user) return { success: false };

    const raw = getRawClient();
    const { error } = await raw.from("user_notifications").update({ is_read: true }).eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
}

export async function markAllUserNotificationsRead() {
    const user = await currentUser();
    if (!user) return { success: false };

    const supabase = getRawClient();

    const { data: profile } = await supabase.from("profiles").select("id").eq("clerk_id", user.id).single();
    if (!profile) return { success: false };

    const { error } = await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("user_id", profile.id)
        .eq("is_read", false);

    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
}
