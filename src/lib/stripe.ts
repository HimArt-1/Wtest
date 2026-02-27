// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — Stripe Client
//  بوابة الدفع — Mada, Apple Pay, Visa, Mastercard
// ═══════════════════════════════════════════════════════════

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey && process.env.NODE_ENV === "production") {
    console.warn("[Stripe] STRIPE_SECRET_KEY غير معرّف — الدفع الإلكتروني غير متاح");
}

export const stripe = secretKey
    ? new Stripe(secretKey, { typescript: true })
    : null;

export const STRIPE_ENABLED = !!stripe;
