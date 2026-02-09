// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — Products Actions
//  Server Actions لجلب المنتجات للمتجر
// ═══════════════════════════════════════════════════════════

"use server";

import { getSupabaseServerClient } from "@/lib/supabase";
import { unstable_noStore as noStore } from "next/cache";

export async function getProducts(
    page = 1,
    type = "all"
) {
    noStore();
    const supabase = getSupabaseServerClient();
    const itemsPerPage = 12;
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
        .from("products")
        .select(`
      *,
      artist:profiles(id, display_name, username, avatar_url)
    `, { count: "exact" })
        .eq("in_stock", true);

    if (type !== "all") {
        query = query.eq("type", type);
    }

    const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Error fetching products:", error);
        return { data: [], count: 0, totalPages: 0 };
    }

    return {
        data,
        count: count || 0,
        totalPages: count ? Math.ceil(count / itemsPerPage) : 0,
    };
}

export async function getProductById(id: string) {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
        .from("products")
        .select(`
      *,
      artist:profiles(id, display_name, username, avatar_url)
    `)
        .eq("id", id)
        .single();

    if (error) return null;
    return data;
}
