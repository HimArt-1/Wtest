"use server";

import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

interface ImportPayload {
    warehouseId: string;
    items: {
        title: string;
        sizes: { [size: string]: number };
    }[];
    columns: string[]; // List of size names
}

async function requireInventoryImportAdmin() {
    const user = await currentUser();
    if (!user) {
        return { error: "غير مصرح" as const };
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("clerk_id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return { error: "صلاحيات غير كافية" as const };
    }

    return { supabase, profile };
}

export async function inventoryImportAction(payload: ImportPayload) {
    console.log("Starting Smart Inventory Import...", payload.items.length, "items");
    
    try {
        const adminAccess = await requireInventoryImportAdmin();
        if ("error" in adminAccess) {
            return {
                success: false,
                message: adminAccess.error ?? "صلاحيات غير كافية",
                logs: [] as string[],
            };
        }

        const supabaseAdmin = adminAccess.supabase;
        const { warehouseId, items, columns } = payload;
        
        let productsCreated = 0;
        let skusCreated = 0;
        let inventoryUpdates = 0;

        // Iterate over imported rows
        for (const item of items) {
            const productTitle = item.title.trim() || 'منتج مستورد بدون اسم';
            
            // 1) Find or Create Product
            let { data: existingProduct, error: productError } = await supabaseAdmin
                .from('products')
                .select('id, title, sizes')
                .ilike('title', productTitle)
                .limit(1)
                .single();

            let productId = existingProduct?.id;
            let currentProductSizes = existingProduct?.sizes || [];

            if (!productId || productError?.code === 'PGRST116') { // PGRST116 = Not found
                // Create New Product
                const { data: newProduct, error: createError } = await supabaseAdmin
                    .from('products')
                    .insert({
                        title: productTitle,
                        description: 'تمت إضافته عبر الاستيراد الذكي',
                        price: 0,
                        type: 'apparel',
                        is_featured: false,
                        in_stock: true,
                        store_name: 'WUSHA',
                        stock_quantity: 0,
                        shipping_time: '1-3 Days',
                        sizes: columns // Set initial available sizes
                    })
                    .select('id')
                    .single();

                if (createError) throw new Error(`Product Creation failed for ${productTitle}: ${createError.message}`);
                productId = newProduct.id;
                productsCreated++;
            } else {
                // Ensure the product has these sizes in its `sizes` array if they aren't there
                const missingSizes = columns.filter(c => !currentProductSizes.includes(c));
                if (missingSizes.length > 0) {
                     await supabaseAdmin
                        .from('products')
                        .update({ sizes: [...currentProductSizes, ...missingSizes] })
                        .eq('id', productId);
                }
            }

            // 2) Process each size quantity in the row
            for (const sizeName of columns) {
                const qty = item.sizes[sizeName] || 0;
                
                // Only process if quantity is valid and non-zero
                // Actually, let's process 0s if they specifically requested it, but usually better to skip
                if (qty === 0) continue; 

                // Generate a predictable SKU format
                // WSH-{PRODUCT_ID_PREFIX}-{SIZE}
                const skuCode = `WSH-${productId.substring(0, 5).toUpperCase()}-${sizeName.toUpperCase()}`;

                // Find or Create SKU
                let { data: skuData, error: skuSearchError } = await supabaseAdmin
                    .from('skus')
                    .select('id')
                    .eq('product_id', productId)
                    .eq('size', sizeName)
                    .limit(1)
                    .single();

                let skuId = skuData?.id;

                if (!skuId || skuSearchError?.code === 'PGRST116') {
                    // Try to insert
                    const { data: newSku, error: skuInsertError } = await supabaseAdmin
                        .from('skus')
                        .insert({
                            product_id: productId,
                            sku: skuCode,
                            size: sizeName,
                            color_code: 'N/A'
                        })
                        .select('id')
                        .single();

                    if (skuInsertError) {
                        // Could be uniqueness constraint, verify
                        console.error("SKU Insert Error:", skuInsertError);
                        continue; 
                    }
                    skuId = newSku.id;
                    skusCreated++;
                }

                // 3) Add Inventory
                // Check if an inventory record exists for this warehouse
                let { data: invData, error: invSearchError } = await supabaseAdmin
                    .from('inventory')
                    .select('id, quantity')
                    .eq('sku_id', skuId)
                    .eq('warehouse_id', warehouseId)
                    .limit(1)
                    .single();

                if (invData && !invSearchError) {
                    // Update existing
                    await supabaseAdmin
                        .from('inventory')
                        .update({ quantity: invData.quantity + qty })
                        .eq('id', invData.id);
                        
                    // Log the movement
                    await supabaseAdmin.from('inventory_movements').insert({
                        sku_id: skuId,
                        warehouse_id: warehouseId,
                        movement_type: 'addition', // It's an import addition
                        quantity: qty,
                        notes: `استيراد ذكي: إضافة ${qty}`
                    });
                } else {
                    // Insert new inventory record
                    await supabaseAdmin
                        .from('inventory')
                        .insert({
                            sku_id: skuId,
                            warehouse_id: warehouseId,
                            quantity: qty,
                            reorder_point: 5,
                            status: 'available'
                        });
                        
                    // Log the movement
                    await supabaseAdmin.from('inventory_movements').insert({
                        sku_id: skuId,
                        warehouse_id: warehouseId,
                        movement_type: 'initial',
                        quantity: qty,
                        notes: `استيراد ذكي: رصيد افتتاحي ${qty}`
                    });
                }
                
                inventoryUpdates++;
            }
        }

        revalidatePath('/dashboard/products-inventory');
        revalidatePath('/dashboard/products');
        
        return {
            success: true,
            message: `تم الاستيراد بنجاح! تم إنشاء ${productsCreated} منتج جديد، توليد ${skusCreated} رمز SKU، وتنفيذ ${inventoryUpdates} عملية تحديث للمخزون.`
        };

    } catch (err: any) {
        console.error("Import error:", err);
        return { success: false, message: "حدث خطأ غير متوقع", logs: [err.message] };
    }
}
