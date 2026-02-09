// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — Artworks Actions
//  Server Actions لجلب الأعمال الفنية
// ═══════════════════════════════════════════════════════════

"use server";

import { getSupabaseServerClient } from "@/lib/supabase";
import { unstable_noStore as noStore } from "next/cache";

export async function getFeaturedArtworks() {
    noStore();
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
        .from("artworks")
        .select(`
      *,
      artist:profiles(id, display_name, username, avatar_url, is_verified)
    `)
        .eq("status", "published")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(6);

    if (error) {
        console.error("Error fetching featured artworks:", error);
        return [];
    }

    return data;
}

export async function getArtworks(
    page = 1,
    category = "all",
    search = ""
) {
    noStore();
    const supabase = getSupabaseServerClient();
    const itemsPerPage = 12;
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
        .from("artworks")
        .select(`
      *,
      artist:profiles(id, display_name, username, avatar_url, is_verified)
    `, { count: "exact" })
        .eq("status", "published");

    // Filter by category
    if (category !== "all") {
        // We need to join categories to filter by slug
        // But since we store category_id, we'd need a subquery or join.
        // For simplicity, let's assume we pass the category SLUG and find its ID first
        // Or simpler: Fetch category text from relation.
        // Efficient way:
        const { data } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", category)
            .single();

        const catData = data as { id: string } | null;

        if (catData) {
            query = query.eq("category_id", catData.id);
        }
    }

    // Search by title
    if (search) {
        query = query.ilike("title", `%${search}%`);
    }

    const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Error fetching artworks:", error);
        return { data: [], count: 0, totalPages: 0 };
    }

    return {
        data,
        count: count || 0,
        totalPages: count ? Math.ceil(count / itemsPerPage) : 0,
    };
}

export async function getArtworkById(id: string) {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
        .from("artworks")
        .select(`
      *,
      artist:profiles(id, display_name, username, bio, avatar_url, is_verified)
    `)
        .eq("id", id)
        .single();

    if (error) return null;
    return data;
}
