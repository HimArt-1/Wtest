// ═══════════════════════════════════════════════════════════
//  وشّى | WASHA — Checkout Actions
//  إنشاء جلسة Stripe للدفع الإلكتروني
// ═══════════════════════════════════════════════════════════

"use server";

import { stripe, STRIPE_ENABLED } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";

const SHIPPING_COST = 30;
const TAX_RATE = 0.15;

export async function createStripeCheckoutUrl(params: {
    orderId: string;
    orderNumber: string;
    total: number;
    successUrl: string;
    cancelUrl: string;
}) {
    if (!STRIPE_ENABLED || !stripe) {
        return { success: false, error: "الدفع الإلكتروني غير متاح حالياً" };
    }

    const user = await currentUser();
    if (!user) {
        return { success: false, error: "يجب تسجيل الدخول" };
    }

    try {
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "sar",
                        product_data: {
                            name: `طلب وشّى #${params.orderNumber}`,
                            description: "منتجات فنية من منصة وشّى",
                            images: [],
                        },
                        unit_amount: Math.round(params.total * 100), // هللات
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                order_id: params.orderId,
                order_number: params.orderNumber,
                clerk_user_id: user.id,
            },
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            customer_email: user.emailAddresses?.[0]?.emailAddress || undefined,
        });

        return {
            success: true,
            url: session.url,
        };
    } catch (err: unknown) {
        console.error("[createStripeCheckoutUrl]", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "فشل في إنشاء جلسة الدفع",
        };
    }
}

export { STRIPE_ENABLED };
