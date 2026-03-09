// ═══════════════════════════════════════════════════════════
//  وشّى | WASHA — Stripe Webhook
//  معالجة أحداث الدفع — checkout.session.completed
// ═══════════════════════════════════════════════════════════

import { stripe } from "@/lib/stripe";
import { confirmOrderPayment } from "@/app/actions/orders";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    // التحقق من المتغيرات البيئية في runtime فقط
    if (typeof window === "undefined" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // أثناء البناء، تجاهل هذا الـ route
        return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
    }
    
    if (!stripe || !webhookSecret) {
        console.warn("[Stripe Webhook] Stripe أو STRIPE_WEBHOOK_SECRET غير معرّف");
        return NextResponse.json({ error: "Webhook غير مفعّل" }, { status: 500 });
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "توقيع مفقود" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        const message = err instanceof Error ? err.message : "خطأ غير معروف";
        console.error("[Stripe Webhook] فشل التحقق:", message);
        return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "payment" && session.payment_status === "paid") {
            const orderId = session.metadata?.order_id;
            const customerEmail = session.customer_email || session.customer_details?.email;

            if (orderId) {
                try {
                    const result = await confirmOrderPayment(orderId, {
                        customerEmail: customerEmail || undefined,
                    });
                    if (result.success) {
                        console.log("[Stripe Webhook] تم تأكيد الطلب:", orderId);
                    } else {
                        console.error("[Stripe Webhook] فشل تأكيد الطلب:", orderId);
                    }
                } catch (error) {
                    console.error("[Stripe Webhook] خطأ في confirmOrderPayment:", error);
                }
            } else {
                console.warn("[Stripe Webhook] لا يوجد order_id في metadata");
            }
        }
    }

    return NextResponse.json({ received: true });
}
