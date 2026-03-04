"use server";

import { getSupabaseServerClient } from "@/lib/supabase";
import { UserNotificationType, UserNotification } from "@/types/database";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createUserNotification(data: {
    userId: string;
    type: UserNotificationType | string;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
}) {
    const supabase = getSupabaseServerClient();
    const { error } = await (supabase as any).from("user_notifications").insert({
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

    const supabase = getSupabaseServerClient();
    // Resolve profile ID from clerk ID
    const { data: profile } = await (supabase as any).from("profiles").select("id").eq("clerk_id", user.id).single();
    if (!profile) return [];

    const { data, error } = await (supabase as any)
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

    const supabase = getSupabaseServerClient();
    const { data: profile } = await (supabase as any).from("profiles").select("id").eq("clerk_id", user.id).single();
    if (!profile) return 0;

    const { count, error } = await (supabase as any)
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

    const supabase = getSupabaseServerClient();
    // RLS will ensure user can only update their own
    const { error } = await (supabase as any).from("user_notifications").update({ is_read: true }).eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
}

export async function markAllUserNotificationsRead() {
    const user = await currentUser();
    if (!user) return { success: false };

    const supabase = getSupabaseServerClient();
    const { data: profile } = await (supabase as any).from("profiles").select("id").eq("clerk_id", user.id).single();
    if (!profile) return { success: false };

    const { error } = await (supabase as any)
        .from("user_notifications")
        .update({ is_read: true })
        .eq("user_id", profile.id)
        .eq("is_read", false);

    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
}
