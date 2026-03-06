"use server";

import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { Database, SalesMethodType } from "@/types/database";

function getAdminSb() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}

async function verifyAdmin() {
    const user = await currentUser();
    if (!user) return { user: null, isAdmin: false };
    const supabase = getAdminSb();
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("clerk_id", user.id)
        .single();
    return { user, isAdmin: (profile as any)?.role === "admin" };
}

export async function getSalesRecords(method?: SalesMethodType) {
    const { isAdmin } = await verifyAdmin();
    if (!isAdmin) return { error: "غير مصرح" };

    const supabase = getAdminSb();
    let query = supabase
        .from("sales_records")
        .select("*, sku:product_skus(sku, size, color_code, product:products(title))")
        .order("created_at", { ascending: false });

    if (method) query = query.eq("sales_method", method);

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { records: data };
}

export async function recordManualSale(
    skuId: string,
    quantity: number,
    totalPrice: number,
    warehouseId: string,
    notes?: string
) {
    const { user, isAdmin } = await verifyAdmin();
    if (!isAdmin) return { error: "غير مصرح" };

    const supabase = getAdminSb();

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('clerk_id', user!.id)
            .single();

        // 1. Record Sale
        const unitPrice = totalPrice / quantity;
        const { data: sale, error: saleError } = await (supabase.from("sales_records") as any)
            .insert([{
                sales_method: 'booth_manual',
                sku_id: skuId,
                quantity: quantity,
                unit_price: unitPrice,
                total_price: totalPrice,
                status: 'completed',
                notes: notes,
                created_by: (profile as any)?.id
            }])
            .select()
            .single();

        if (saleError) throw saleError;

        // 2. Adjust Inventory (Deduct)
        const { data: currentLevel } = await (supabase
            .from("inventory_levels")
            .select("quantity")
            .eq("sku_id", skuId)
            .eq("warehouse_id", warehouseId)
            .single() as any);

        const previousQuantity = currentLevel ? currentLevel.quantity : 0;
        const newQuantity = previousQuantity - quantity; // Negative change for sale

        const { error: upsertError } = await (supabase.from("inventory_levels") as any)
            .upsert({
                sku_id: skuId,
                warehouse_id: warehouseId,
                quantity: newQuantity,
                updated_at: new Date().toISOString()
            }, { onConflict: "sku_id,warehouse_id" });

        if (upsertError) throw upsertError;

        // Record Transaction
        await (supabase.from("inventory_transactions") as any)
            .insert([{
                sku_id: skuId,
                warehouse_id: warehouseId,
                transaction_type: 'sale',
                quantity_change: -quantity,
                previous_quantity: previousQuantity,
                new_quantity: newQuantity,
                reference_id: sale.id,
                notes: `POS Hand Sale`,
                created_by: (profile as any)?.id
            }]);

        return { success: true, sale };
    } catch (e: any) {
        console.error("Sale error", e);
        return { error: e.message || "حدث خطأ أثناء تسجيل المبيعات" };
    }
}
