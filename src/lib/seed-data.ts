// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — Data Seeding Script
//  بيانات أولية للتجربة (فنانين، أعمال، منتجات)
// ═══════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

const ARTISTS = [
    {
        clerk_id: "user_test_artist_1",
        display_name: "نورة الشمري",
        username: "nora_art",
        bio: "فنانة تشكيلية متخصصة في رسم الطبيعة الصحراوية بأسلوب معاصر.",
        role: "artist",
        avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
        is_verified: true,
    },
    {
        clerk_id: "user_test_artist_2",
        display_name: "يوسف الغامدي",
        username: "yousef_design",
        bio: "مصمم جرافيك وفنان رقمي، أدمج بين الخط العربي والفن التجريدي.",
        role: "artist",
        avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
        is_verified: true,
    },
    {
        clerk_id: "user_test_artist_3",
        display_name: "فاطمة الدوسري",
        username: "fatima_abstract",
        bio: "أحب الألوان والحرية في التعبير. أعمالي تعكس التراث برؤية حديثة.",
        role: "artist",
        avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80",
        is_verified: false,
    },
];

const ARTWORKS = [
    {
        title: "صحراء الأحلام",
        category_slug: "digital",
        image_url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80",
        price: 2500,
        artist_idx: 0,
        is_featured: true,
    },
    {
        title: "بوابة الزمن",
        category_slug: "photography",
        image_url: "https://images.unsplash.com/photo-1518998053901-5348d3969105?w=800&q=80",
        price: 1800,
        artist_idx: 1,
        is_featured: true,
    },
    {
        title: "حروف عربية",
        category_slug: "calligraphy",
        image_url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80",
        price: 3200,
        artist_idx: 1,
        is_featured: false,
    },
    {
        title: "روح التراث",
        category_slug: "traditional",
        image_url: "https://images.unsplash.com/photo-1578926288207-a90a5366759d?w=800&q=80",
        price: 5500,
        artist_idx: 2,
        is_featured: true,
    },
    {
        title: "أزرق سماوي",
        category_slug: "abstract",
        image_url: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&q=80",
        price: 2900,
        artist_idx: 2,
        is_featured: false,
    },
    {
        title: "هدوء الليل",
        category_slug: "digital",
        image_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        price: 1200,
        artist_idx: 0,
        is_featured: true,
    },
];

const PRODUCTS = [
    {
        title: "طباعة قماشية - صحراء الأحلام",
        type: "print",
        price: 450,
        image_url: "https://images.unsplash.com/photo-1579783483458-83d02161294e?w=600&q=80",
        artist_idx: 0,
        is_featured: true,
    },
    {
        title: "هودي وشّى - إصدار محدود",
        type: "apparel",
        price: 280,
        image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80",
        artist_idx: 1,
        is_featured: true,
    },
    {
        title: "NFT #882 - Future Art",
        type: "nft",
        price: 1500, // Converted roughly
        currency: "ETH",
        image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
        artist_idx: 2,
        is_featured: false,
    },
];

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

    // 2. Create Artists
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
