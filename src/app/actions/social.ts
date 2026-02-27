// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — Social Actions
//  متابعة فنان، محفوظات، إعجاب بمنتج
// ═══════════════════════════════════════════════════════════

"use server";

import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
    );
}

// ─── متابعة الفنان ───────────────────────────────────────

export async function followArtist(artistId: string) {
    const user = await currentUser();
    if (!user) return { success: false, error: "يجب تسجيل الدخول" };

    const supabase = getSupabase();
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    if (!profile) return { success: false, error: "الملف الشخصي غير موجود" };
    if (profile.id === artistId) return { success: false, error: "لا يمكن متابعة نفسك" };

    const { error } = await supabase
        .from("artist_follows")
        .insert({ follower_id: profile.id, artist_id: artistId });

    if (error) {
        if (error.code === "23505") return { success: true };
        return { success: false, error: error.message };
    }

    revalidatePath("/artists/[username]", "page");
    return { success: true };
}

export async function unfollowArtist(artistId: string) {
    const user = await currentUser();
    if (!user) return { success: false, error: "يجب تسجيل الدخول" };

    const supabase = getSupabase();
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    if (!profile) return { success: false, error: "الملف الشخصي غير موجود" };

    await supabase
        .from("artist_follows")
        .delete()
        .eq("follower_id", profile.id)
        .eq("artist_id", artistId);

    revalidatePath("/artists/[username]", "page");
    return { success: true };
}

export async function isFollowingArtist(artistId: string): Promise<boolean> {
    const user = await currentUser();
    if (!user) return false;

    const supabase = getSupabase();
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    if (!profile) return false;

    const { data } = await supabase
        .from("artist_follows")
        .select("id")
        .eq("follower_id", profile.id)
        .eq("artist_id", artistId)
        .maybeSingle();

    return !!data;
}

export async function getArtistFollowersCount(artistId: string): Promise<number> {
    const supabase = getSupabase();
    const { count } = await supabase
        .from("artist_follows")
        .select("id", { count: "exact", head: true })
        .eq("artist_id", artistId);
    return count ?? 0;
}

// ─── محفوظات المنتج (Wishlist) ────────────────────────────

export async function addToWishlist(productId: string) {
    const user = await currentUser();
    if (!user) return { success: false, error: "يجب تسجيل الدخول" };

    const supabase = getSupabase();
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    if (!profile) return { success: false, error: "الملف الشخصي غير موجود" };

    const { error } = await supabase
        .from("product_wishlist")
        .insert({ user_id: profile.id, product_id: productId });

    if (error) {
        if (error.code === "23505") return { success: true };
        return { success: false, error: error.message };
    }

    revalidatePath("/products/[id]", "page");
    revalidatePath("/account/wishlist", "page");
    return { success: true };
}

export async function removeFromWishlist(productId: string) {
    const user = await currentUser();
    if (!user) return { success: false, error: "يجب تسجيل الدخول" };

    const supabase = getSupabase();
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    if (!profile) return { success: false, error: "الملف الشخصي غير موجود" };

    await supabase
        .from("product_wishlist")
        .delete()
        .eq("user_id", profile.id)
        .eq("product_id", productId);

    revalidatePath("/products/[id]", "page");
    revalidatePath("/account/wishlist", "page");
    return { success: true };
}

export async function isInWishlist(productId: string): Promise<boolean> {
    const user = await currentUser();
    if (!user) return false;

    const supabase = getSupabase();
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    if (!profile) return false;

    const { data } = await supabase
        .from("product_wishlist")
        .select("id")
        .eq("user_id", profile.id)
        .eq("product_id", productId)
        .maybeSingle();

    return !!data;
}

export async function getWishlistProducts() {
    const user = await currentUser();
    if (!user) return { data: [], count: 0 };

    const supabase = getSupabase();
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    if (!profile) return { data: [], count: 0 };

    const { data: wishlistItems } = await supabase
        .from("product_wishlist")
        .select("product_id")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

    if (!wishlistItems?.length) return { data: [], count: 0 };

    const productIds = wishlistItems.map((r: { product_id: string }) => r.product_id);
    const { data: products } = await supabase
        .from("products")
        .select("id, title, price, image_url, type, in_stock, artist:profiles(display_name, username)")
        .in("id", productIds);

    const orderMap = Object.fromEntries(productIds.map((id, i) => [id, i]));
    const sorted = (products || []).sort((a: any, b: any) => (orderMap[a.id] ?? 99) - (orderMap[b.id] ?? 99));
    return { data: sorted, count: sorted.length };
}

export async function getWishlistProductIds(): Promise<string[]> {
    const user = await currentUser();
    if (!user) return [];

    const supabase = getSupabase();
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    if (!profile) return [];

    const { data } = await supabase
        .from("product_wishlist")
        .select("product_id")
        .eq("user_id", profile.id);

    return (data || []).map((r: { product_id: string }) => r.product_id);
}

// ─── إعجاب بالمنتج ───────────────────────────────────────

export async function likeProduct(productId: string) {
    const user = await currentUser();
    if (!user) return { success: false, error: "يجب تسجيل الدخول" };

    const supabase = getSupabase();
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    if (!profile) return { success: false, error: "الملف الشخصي غير موجود" };

    const { error } = await supabase
        .from("product_likes")
        .insert({ user_id: profile.id, product_id: productId });

    if (error) {
        if (error.code === "23505") return { success: true };
        return { success: false, error: error.message };
    }

    revalidatePath("/products/[id]", "page");
    return { success: true };
}

export async function unlikeProduct(productId: string) {
    const user = await currentUser();
    if (!user) return { success: false, error: "يجب تسجيل الدخول" };

    const supabase = getSupabase();
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    if (!profile) return { success: false, error: "الملف الشخصي غير موجود" };

    await supabase
        .from("product_likes")
        .delete()
        .eq("user_id", profile.id)
        .eq("product_id", productId);

    revalidatePath("/products/[id]", "page");
    return { success: true };
}

export async function isProductLiked(productId: string): Promise<boolean> {
    const user = await currentUser();
    if (!user) return false;

    const supabase = getSupabase();
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    if (!profile) return false;

    const { data } = await supabase
        .from("product_likes")
        .select("id")
        .eq("user_id", profile.id)
        .eq("product_id", productId)
        .maybeSingle();

    return !!data;
}

export async function getProductLikesCount(productId: string): Promise<number> {
    const supabase = getSupabase();
    const { count } = await supabase
        .from("product_likes")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId);
    return count ?? 0;
}
