"use server";

import { createClient } from "@supabase/supabase-js";

function getClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

/** التحقق من توفر المخزون قبل إنشاء الطلب */
export async function checkStockAvailability(
    items: { product_id: string | null; quantity: number }[]
): Promise<{ ok: boolean; error?: string; product?: string }> {
    const supabase = getClient();
    for (const item of items) {
        if (!item.product_id) continue; // تصاميم مخصصة لا مخزون لها
        const { data: product } = await supabase
            .from("products")
            .select("id, title, stock_quantity, in_stock")
            .eq("id", item.product_id)
            .single();
        if (!product) return { ok: false, error: "منتج غير موجود", product: item.product_id };
        if (!product.in_stock) return { ok: false, error: `المنتج "${product.title}" غير متوفر`, product: product.title };
        if (product.stock_quantity != null && product.stock_quantity < item.quantity) {
            return { ok: false, error: `الكمية المطلوبة من "${product.title}" تتجاوز المخزون (${product.stock_quantity})`, product: product.title };
        }
    }
    return { ok: true };
}

/** خصم المخزون عند تأكيد الطلب */
export async function decrementStockForOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient();
    const { data: items } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);
    if (!items?.length) return { success: true };
    for (const item of items) {
        if (!item.product_id) continue;
        const { data: product } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", item.product_id)
            .single();
        if (!product) continue;
        if (product.stock_quantity == null) continue; // مخزون غير محدود
        const newQty = Math.max(0, product.stock_quantity - item.quantity);
        await supabase
            .from("products")
            .update({
                stock_quantity: newQty,
                in_stock: newQty > 0,
            })
            .eq("id", item.product_id);
    }
    return { success: true };
}

/** استرجاع المخزون عند إلغاء الطلب */
export async function restoreStockForOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getClient();
    const { data: items } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);
    if (!items?.length) return { success: true };
    for (const item of items) {
        if (!item.product_id) continue;
        const { data: product } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", item.product_id)
            .single();
        if (!product) continue;
        if (product.stock_quantity == null) continue;
        const newQty = (product.stock_quantity || 0) + item.quantity;
        await supabase
            .from("products")
            .update({
                stock_quantity: newQty,
                in_stock: true,
            })
            .eq("id", item.product_id);
    }
    return { success: true };
}
