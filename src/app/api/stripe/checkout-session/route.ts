// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — Stripe Checkout Session (Custom UI)
//  ينشئ جلسة دفع مدمجة داخل الموقع بدلاً من إعادة التوجيه
// ═══════════════════════════════════════════════════════════

import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    if (!stripe) {
        return NextResponse.json({ error: "Stripe غير مفعّل" }, { status: 500 });
    }

    const user = await currentUser();
    if (!user) {
        return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    try {
        const { orderId, orderNumber, total } = await req.json();

        if (!orderId || !orderNumber || !total) {
            return NextResponse.json({ error: "بيانات الطلب ناقصة" }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            ui_mode: "custom",
            mode: "payment",
            currency: "sar",
            line_items: [
                {
                    price_data: {
                        currency: "sar",
                        product_data: {
                            name: `طلب وشّى #${orderNumber}`,
                            description: "منتجات فنية من منصة وشّى",
                        },
                        unit_amount: Math.round(total * 100), // هللات
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                order_id: orderId,
                order_number: orderNumber,
                clerk_user_id: user.id,
            },
            // عند 3D Secure يُعاد التوجيه لهذا الرابط
            return_url: `${baseUrl}/checkout?success=1&order=${encodeURIComponent(orderNumber)}`,
            customer_email: user.emailAddresses?.[0]?.emailAddress || undefined,
        });

        return NextResponse.json({ clientSecret: session.client_secret });
    } catch (err: unknown) {
        console.error("[Stripe Checkout Session]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "فشل في إنشاء جلسة الدفع" },
            { status: 500 }
        );
    }
}
