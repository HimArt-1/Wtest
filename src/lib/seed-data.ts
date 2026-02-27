// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — Data Seeding Script
//  بيانات أولية (فئات فقط). تم إزالة الحسابات التجريبية للفنانين.
// ═══════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

/** لا توجد حسابات فنانين تجريبية — يتم إضافتها من لوحة الإدارة أو طلبات الانضمام */
const ARTISTS: Array<{
    clerk_id: string;
    display_name: string;
    username: string;
    bio?: string;
    role: string;
    avatar_url?: string;
    is_verified?: boolean;
}> = [];

const ARTWORKS: Array<{ title: string; category_slug: string; image_url: string; price: number; artist_idx: number; is_featured?: boolean }> = [];
const PRODUCTS: Array<{ title: string; type: string; price: number; image_url: string; artist_idx: number; is_featured?: boolean; currency?: string }> = [];

export async function seedData() {
    console.log("🌱 Starting seed...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
    });

    // 1. Get Categories Map
    const { data: categories } = await supabase.from("categories").select("id, slug");
    if (!categories || categories.length === 0) {
        console.error("❌ Categories not found. Run schema.sql first.");
        return;
    }
    const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

    // 2. Create Artists (فارغ — لا حسابات تجريبية)
    const createdArtistIds: string[] = [];

    for (const artist of ARTISTS) {
        // Check if exists
        const { data: existing } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", artist.username)
            .single();

        if (existing) {
            createdArtistIds.push(existing.id);
            continue;
        }

        const { data, error } = await supabase
            .from("profiles")
            .insert([artist])
            .select("id")
            .single();

        if (error) {
            console.error("❌ Error creating artist:", artist.username, error);
        } else {
            createdArtistIds.push(data.id);
        }
    }

    // 3. Create Artworks
    if (createdArtistIds.length > 0) {
        for (const artwork of ARTWORKS) {
            const artistId = createdArtistIds[artwork.artist_idx];
            const categoryId = categoryMap[artwork.category_slug];

            const { error } = await supabase.from("artworks").insert([{
                artist_id: artistId,
                category_id: categoryId,
                title: artwork.title,
                image_url: artwork.image_url,
                price: artwork.price,
                status: "published",
                is_featured: artwork.is_featured,
                likes_count: Math.floor(Math.random() * 500),
                views_count: Math.floor(Math.random() * 5000),
            }]);

            if (error) console.error("❌ Error creating artwork:", artwork.title, error);
        }

        // 4. Create Products
        for (const product of PRODUCTS) {
            const artistId = createdArtistIds[product.artist_idx];

            const { error } = await supabase.from("products").insert([{
                artist_id: artistId,
                title: product.title,
                image_url: product.image_url,
                price: product.price,
                type: product.type,
                currency: product.currency || 'SAR',
                is_featured: product.is_featured || false,
                in_stock: true,
                rating: 4.5 + Math.random() * 0.5,
            }]);

            if (error) console.error("❌ Error creating product:", product.title, error);
        }
    }

    console.log("✅ Seeding completed!");
}
