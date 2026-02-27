"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

// ─── Admin Guard ───────────────────────────────────────────

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Missing Supabase env");
    return createClient(url, key, { auth: { persistSession: false } });
}

async function requireAdmin() {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");
    const supabase = getAdminSupabase();
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("clerk_id", user.id)
        .single();
    if (!profile || profile.role !== "admin") throw new Error("Forbidden");
    return { user, supabase };
}

// ─── Types ─────────────────────────────────────────────────

export type ClerkUserWithProfile = {
    id: string;
    name: string;
    email: string | null;
    imageUrl: string | null;
    createdAt: number;
    lastSignInAt: number | null;
    profile: {
        id: string;
        role: string;
        display_name: string;
        username: string;
    } | null;
};

// ─── Get Clerk Users List ───────────────────────────────────

const PER_PAGE = 20;

export async function getClerkUsersList(
    page: number = 1,
    query: string = ""
): Promise<{
    data: ClerkUserWithProfile[];
    totalCount: number;
    totalPages: number;
}> {
    await requireAdmin();

    const client = await clerkClient();
    const offset = (page - 1) * PER_PAGE;

    const { data: clerkUsers, totalCount } = await client.users.getUserList({
        limit: PER_PAGE,
        offset,
        query: query.trim() || undefined,
        orderBy: "-created_at",
    });

    if (!clerkUsers || clerkUsers.length === 0) {
        return { data: [], totalCount: totalCount ?? 0, totalPages: 0 };
    }

    const clerkIds = clerkUsers.map((u) => u.id);
    const supabase = getAdminSupabase();
    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, clerk_id, role, display_name, username")
        .in("clerk_id", clerkIds);

    const profileByClerkId = new Map(
        (profiles || []).map((p) => [(p as any).clerk_id, p])
    );

    const data: ClerkUserWithProfile[] = clerkUsers.map((u) => {
        const p = profileByClerkId.get(u.id);
        const primaryEmail = u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId);
        return {
            id: u.id,
            name: [u.firstName, u.lastName].filter(Boolean).join(" ") || primaryEmail?.emailAddress || "—",
            email: primaryEmail?.emailAddress ?? null,
            imageUrl: u.imageUrl ?? null,
            createdAt: u.createdAt,
            lastSignInAt: u.lastSignInAt ?? null,
            profile: p
                ? {
                    id: (p as any).id,
                    role: (p as any).role,
                    display_name: (p as any).display_name,
                    username: (p as any).username,
                }
                : null,
        };
    });

    return {
        data,
        totalCount: totalCount ?? 0,
        totalPages: Math.ceil((totalCount ?? 0) / PER_PAGE),
    };
}
