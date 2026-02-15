// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — Orders Actions
//  Server Actions لإنشاء وإدارة الطلبات
// ═══════════════════════════════════════════════════════════

"use server";

import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}

interface OrderItemInput {
    product_id: string;
    quantity: number;
    size: string | null;
    unit_price: number;
}

interface ShippingAddressInput {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
    phone?: string;
}

const SHIPPING_COST = 30;
const TAX_RATE = 0.15;

export async function createOrder(
    items: OrderItemInput[],
    shippingAddress: ShippingAddressInput
) {
    // 1. Verify authenticated user
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "يجب تسجيل الدخول لإتمام الطلب" };
    }

    const supabase = getAdminClient();

    // 2. Get or create buyer's profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    let buyerId: string;

    if (profile) {
        buyerId = profile.id;
    } else {
        // Create a profile if it doesn't exist
        const { data: newProfile, error: profileError } = await supabase
            .from("profiles")
            .insert({
                clerk_id: user.id,
                display_name: user.firstName || user.username || "مشتري",
                username: user.username || `user_${user.id.slice(-8)}`,
                role: "buyer",
            })
            .select("id")
            .single();

        if (profileError || !newProfile) {
            return { success: false, error: "فشل في إنشاء الملف الشخصي" };
        }
        buyerId = newProfile.id;
    }

    // 3. Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + SHIPPING_COST + tax;

    // 4. Create order
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
            buyer_id: buyerId,
            subtotal,
            shipping_cost: SHIPPING_COST,
            tax,
            total,
            currency: "SAR",
            shipping_address: shippingAddress,
        })
        .select("id, order_number")
        .single();

    if (orderError || !order) {
        console.error("Order creation error:", orderError);
        return { success: false, error: "فشل في إنشاء الطلب" };
    }

    // 5. Create order items
    const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        size: item.size,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
    }));

    const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

    if (itemsError) {
        console.error("Order items error:", itemsError);
        return {
            success: true,
            order_number: order.order_number,
            warning: "تم إنشاء الطلب لكن بعض العناصر لم تُسجل",
        };
    }

    return {
        success: true,
        order_number: order.order_number,
        total,
    };
}

// ─── Get User Orders ────────────────────────────────────────

export async function getUserOrders() {
    const user = await currentUser();
    if (!user) return { data: [], count: 0 };

    const supabase = getAdminClient();

    // Get profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    if (!profile) return { data: [], count: 0 };

    // Fetch orders
    const { data, error, count } = await supabase
        .from("orders")
        .select(`
            *,
            items:order_items(
                *,
                product:products(id, title, image_url, type)
            )
        `, { count: "exact" })
        .eq("buyer_id", profile.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching user orders:", error);
        return { data: [], count: 0 };
    }

    return { data: (data as any[]) || [], count: count || 0 };
}

