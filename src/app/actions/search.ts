// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — Search Actions
//  Server Actions للبحث الموحد في المنصة
// ═══════════════════════════════════════════════════════════

"use server";

import { getSupabaseServerClient } from "@/lib/supabase";
import { unstable_noStore as noStore } from "next/cache";

// ─── Types ──────────────────────────────────────────────────

export type SearchTab = "artworks" | "products" | "artists";

export interface SearchFilters {
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    productType?: string;
    sortBy?: "newest" | "oldest" | "price_asc" | "price_desc" | "popular";
}

export interface SearchResult {
    artworks: { data: any[]; count: number };
    products: { data: any[]; count: number };
    artists: { data: any[]; count: number };
}

// ─── Global Search ──────────────────────────────────────────

export async function globalSearch(
    query: string,
    tab: SearchTab = "artworks",
    page = 1,
    filters: SearchFilters = {}
): Promise<SearchResult> {
    noStore();
    const supabase = getSupabaseServerClient();
    const itemsPerPage = 12;
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    const searchTerm = `%${query}%`;

    // Build results object
    const result: SearchResult = {
        artworks: { data: [], count: 0 },
        products: { data: [], count: 0 },
        artists: { data: [], count: 0 },
    };

    // ─── Search Artworks ────────────────────────────────────
    if (tab === "artworks" || !query) {
        let artworkQuery = supabase
            .from("artworks")
            .select(`
                *,
                artist:profiles(id, display_name, username, avatar_url, is_verified),
                category:categories(name_ar, slug)
            `, { count: "exact" })
            .eq("status", "published");

        if (query) {
            artworkQuery = artworkQuery.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
        }

        // Category filter
        if (filters.category && filters.category !== "all") {
            const { data: cat } = await supabase
                .from("categories")
                .select("id")
                .eq("slug", filters.category)
                .single();
            if (cat) {
                artworkQuery = artworkQuery.eq("category_id", (cat as any).id);
            }
        }

        // Price filter
        if (filters.minPrice !== undefined) {
            artworkQuery = artworkQuery.gte("price", filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
            artworkQuery = artworkQuery.lte("price", filters.maxPrice);
        }

        // Sort
        switch (filters.sortBy) {
            case "oldest":
                artworkQuery = artworkQuery.order("created_at", { ascending: true });
                break;
            case "price_asc":
                artworkQuery = artworkQuery.order("price", { ascending: true });
                break;
            case "price_desc":
                artworkQuery = artworkQuery.order("price", { ascending: false });
                break;
            case "popular":
                artworkQuery = artworkQuery.order("views_count", { ascending: false });
                break;
            default:
                artworkQuery = artworkQuery.order("created_at", { ascending: false });
        }

        const { data, count } = await artworkQuery.range(from, to);
        result.artworks = { data: (data as any[]) || [], count: count || 0 };
    }

    // ─── Search Products ────────────────────────────────────
    if (tab === "products" || !query) {
        let productQuery = supabase
            .from("products")
            .select(`
                *,
                artist:profiles(id, display_name, username, avatar_url)
            `, { count: "exact" })
            .eq("in_stock", true);

        if (query) {
            productQuery = productQuery.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
        }

        // Product type filter
        if (filters.productType && filters.productType !== "all") {
            productQuery = productQuery.eq("type", filters.productType);
        }

        // Price filter
        if (filters.minPrice !== undefined) {
            productQuery = productQuery.gte("price", filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
            productQuery = productQuery.lte("price", filters.maxPrice);
        }

        // Sort
        switch (filters.sortBy) {
            case "oldest":
                productQuery = productQuery.order("created_at", { ascending: true });
                break;
            case "price_asc":
                productQuery = productQuery.order("price", { ascending: true });
                break;
            case "price_desc":
                productQuery = productQuery.order("price", { ascending: false });
                break;
            default:
                productQuery = productQuery.order("created_at", { ascending: false });
        }

        const { data, count } = await productQuery.range(from, to);
        result.products = { data: (data as any[]) || [], count: count || 0 };
    }

    // ─── Search Artists ─────────────────────────────────────
    if (tab === "artists" || !query) {
        let artistQuery = supabase
            .from("profiles")
            .select("id, display_name, username, bio, avatar_url, cover_url, is_verified, total_artworks, total_sales", { count: "exact" })
            .eq("role", "artist");

        if (query) {
            artistQuery = artistQuery.or(`display_name.ilike.${searchTerm},username.ilike.${searchTerm},bio.ilike.${searchTerm}`);
        }

        // Sort
        switch (filters.sortBy) {
            case "popular":
                artistQuery = artistQuery.order("total_sales", { ascending: false });
                break;
            default:
                artistQuery = artistQuery.order("created_at", { ascending: false });
        }

        const { data, count } = await artistQuery.range(from, to);
        result.artists = { data: (data as any[]) || [], count: count || 0 };
    }

    return result;
}

// ─── Get Categories (for filter dropdown) ───────────────────

export async function getCategories() {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
        .from("categories")
        .select("id, name_ar, name_en, slug")
        .order("sort_order", { ascending: true });

    return (data as any[]) || [];
}
