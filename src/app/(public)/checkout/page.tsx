"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, MapPin, CreditCard, CheckCircle2, ArrowRight, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import { createOrder } from "@/app/actions/orders";
import { useUser } from "@clerk/nextjs";

const SHIPPING_COST = 30;
const TAX_RATE = 0.15;

type CheckoutStep = "review" | "shipping" | "confirm" | "success";

interface ShippingForm {
    name: string;
    line1: string;
    line2: string;
    city: string;
    postal_code: string;
    phone: string;
}

export default function CheckoutPage() {
    const { items, totalPrice, clearCart, removeItem } = useCartStore();
    const { isSignedIn } = useUser();
    const [step, setStep] = useState<CheckoutStep>("review");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");
    const [orderTotal, setOrderTotal] = useState(0);
    const [error, setError] = useState("");

    const [shipping, setShipping] = useState<ShippingForm>({
        name: "",
        line1: "",
        line2: "",
        city: "",
        postal_code: "",
        phone: "",
    });

    const subtotal = totalPrice();
    const tax = subtotal * TAX_RATE;
    const total = subtotal + SHIPPING_COST + tax;

    const handleShippingChange = (field: keyof ShippingForm, value: string) => {
        setShipping((prev) => ({ ...prev, [field]: value }));
    };

    const isShippingValid = shipping.name && shipping.line1 && shipping.city && shipping.phone;

    const handleSubmitOrder = async () => {
        if (!isSignedIn) {
            setError("يجب تسجيل الدخول لإتمام الطلب");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const result = await createOrder(
                items.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    size: item.size,
                    unit_price: item.price,
                })),
                {
                    name: shipping.name,
                    line1: shipping.line1,
                    line2: shipping.line2 || undefined,
                    city: shipping.city,
                    postal_code: shipping.postal_code,
                    country: "SA",
                    phone: shipping.phone,
                }
            );

            if (result.success && "order_number" in result) {
                setOrderNumber(result.order_number || "");
                setOrderTotal("total" in result ? (result.total || total) : total);
                clearCart();
                setStep("success");
            } else {
                setError(result.error || "حدث خطأ أثناء إنشاء الطلب");
            }
        } catch {
            setError("حدث خطأ غير متوقع");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Steps indicator
    const steps = [
        { key: "review", label: "المراجعة", icon: ShoppingBag },
        { key: "shipping", label: "الشحن", icon: MapPin },
        { key: "confirm", label: "التأكيد", icon: CreditCard },
    ];

    const currentStepIndex = steps.findIndex((s) => s.key === step);

    if (items.length === 0 && step !== "success") {
        return (
            <section className="min-h-screen flex items-center justify-center px-4 pt-24">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <ShoppingBag className="w-8 h-8 text-white/20" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">السلة فارغة</h2>
                    <p className="text-white/40 mb-8">أضف منتجات من المتجر لبدء التسوق</p>
                    <Link href="/#store" className="btn-gold px-8 py-3">
                        تصفح المتجر
                    </Link>
                </motion.div>
            </section>
        );
    }

    return (
        <section className="min-h-screen pt-24 pb-16 px-4" dir="rtl">
            <div className="container-wusha max-w-4xl">
                {/* ═══ Steps Indicator ═══ */}
                {step !== "success" && (
                    <div className="flex items-center justify-center gap-2 mb-12">
                        {steps.map((s, i) => {
                            const Icon = s.icon;
                            const isActive = i === currentStepIndex;
                            const isDone = i < currentStepIndex;
                            return (
                                <div key={s.key} className="flex items-center gap-2">
                                    <motion.div
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive
                                            ? "bg-gold/20 text-gold border border-gold/30"
                                            : isDone
                                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                                : "bg-white/5 text-white/30 border border-white/10"
                                            }`}
                                        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {isDone ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : (
                                            <Icon className="w-4 h-4" />
                                        )}
                                        <span className="hidden sm:inline">{s.label}</span>
                                    </motion.div>
                                    {i < steps.length - 1 && (
                                        <div className={`w-8 h-px ${isDone ? "bg-green-500/30" : "bg-white/10"}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* ═══ Step 1: Review ═══ */}
                    {step === "review" && (
                        <motion.div
                            key="review"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">مراجعة الطلب</h1>

                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div
                                        key={`${item.product_id}-${item.size}`}
                                        className="glass-card p-4 flex gap-4 items-center"
                                    >
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                            <Image
                                                src={item.image_url}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                                            <p className="text-xs text-white/40">{item.artist_name}</p>
                                            {item.size && (
                                                <span className="text-[10px] text-gold">{item.size}</span>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <span className="text-sm text-white/60">×{item.quantity}</span>
                                            <p className="text-sm font-bold text-gold">
                                                {(item.price * item.quantity).toFixed(2)} ر.س
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.product_id, item.size)}
                                            className="p-2 text-white/30 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="glass-card p-5 space-y-3">
                                <div className="flex justify-between text-sm text-white/50">
                                    <span>المجموع الفرعي</span>
                                    <span>{subtotal.toFixed(2)} ر.س</span>
                                </div>
                                <div className="flex justify-between text-sm text-white/50">
                                    <span>الشحن</span>
                                    <span>{SHIPPING_COST.toFixed(2)} ر.س</span>
                                </div>
                                <div className="flex justify-between text-sm text-white/50">
                                    <span>الضريبة (15%)</span>
                                    <span>{tax.toFixed(2)} ر.س</span>
                                </div>
                                <div className="flex justify-between font-bold text-white pt-3 border-t border-white/10">
                                    <span>الإجمالي</span>
                                    <span className="text-gold text-lg">{total.toFixed(2)} ر.س</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep("shipping")}
                                className="btn-gold w-full py-3.5 flex items-center justify-center gap-2"
                            >
                                <span>متابعة — عنوان الشحن</span>
                                <ArrowRight className="w-4 h-4 rotate-180" />
                            </button>
                        </motion.div>
                    )}

                    {/* ═══ Step 2: Shipping ═══ */}
                    {step === "shipping" && (
                        <motion.div
                            key="shipping"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setStep("review")}
                                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">عنوان الشحن</h1>
                            </div>

                            <div className="glass-card p-5 sm:p-8 space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="text-sm text-white/60 mb-1.5 block">الاسم الكامل *</label>
                                    <input
                                        type="text"
                                        value={shipping.name}
                                        onChange={(e) => handleShippingChange("name", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none transition-colors"
                                        placeholder="أحمد محمد"
                                    />
                                </div>

                                {/* Address Line 1 */}
                                <div>
                                    <label className="text-sm text-white/60 mb-1.5 block">العنوان *</label>
                                    <input
                                        type="text"
                                        value={shipping.line1}
                                        onChange={(e) => handleShippingChange("line1", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none transition-colors"
                                        placeholder="الحي، الشارع، رقم المبنى"
                                    />
                                </div>

                                {/* Address Line 2 */}
                                <div>
                                    <label className="text-sm text-white/60 mb-1.5 block">تفاصيل إضافية</label>
                                    <input
                                        type="text"
                                        value={shipping.line2}
                                        onChange={(e) => handleShippingChange("line2", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none transition-colors"
                                        placeholder="شقة، طابق (اختياري)"
                                    />
                                </div>

                                {/* City + Postal Code */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-white/60 mb-1.5 block">المدينة *</label>
                                        <input
                                            type="text"
                                            value={shipping.city}
                                            onChange={(e) => handleShippingChange("city", e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none transition-colors"
                                            placeholder="الرياض"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-white/60 mb-1.5 block">الرمز البريدي</label>
                                        <input
                                            type="text"
                                            value={shipping.postal_code}
                                            onChange={(e) => handleShippingChange("postal_code", e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none transition-colors"
                                            placeholder="12345"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="text-sm text-white/60 mb-1.5 block">رقم الهاتف *</label>
                                    <input
                                        type="tel"
                                        value={shipping.phone}
                                        onChange={(e) => handleShippingChange("phone", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none transition-colors"
                                        placeholder="05xxxxxxxx"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setStep("confirm")}
                                disabled={!isShippingValid}
                                className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <span>متابعة — تأكيد الطلب</span>
                                <ArrowRight className="w-4 h-4 rotate-180" />
                            </button>
                        </motion.div>
                    )}

                    {/* ═══ Step 3: Confirm ═══ */}
                    {step === "confirm" && (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setStep("shipping")}
                                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">تأكيد الطلب</h1>
                            </div>

                            {/* Order Summary */}
                            <div className="glass-card p-5 space-y-4">
                                <h3 className="text-sm font-medium text-white/60">المنتجات ({items.length})</h3>
                                {items.map((item) => (
                                    <div key={`${item.product_id}-${item.size}`} className="flex justify-between text-sm">
                                        <span className="text-white/70">
                                            {item.title} ×{item.quantity}
                                            {item.size ? ` (${item.size})` : ""}
                                        </span>
                                        <span className="text-white">{(item.price * item.quantity).toFixed(2)} ر.س</span>
                                    </div>
                                ))}
                                <div className="border-t border-white/10 pt-3 space-y-2">
                                    <div className="flex justify-between text-sm text-white/50">
                                        <span>المجموع الفرعي</span>
                                        <span>{subtotal.toFixed(2)} ر.س</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-white/50">
                                        <span>الشحن</span>
                                        <span>{SHIPPING_COST.toFixed(2)} ر.س</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-white/50">
                                        <span>الضريبة (15%)</span>
                                        <span>{tax.toFixed(2)} ر.س</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-white pt-2 border-t border-white/10">
                                        <span>الإجمالي</span>
                                        <span className="text-gold text-lg">{total.toFixed(2)} ر.س</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address Summary */}
                            <div className="glass-card p-5 space-y-2">
                                <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    عنوان الشحن
                                </h3>
                                <p className="text-sm text-white">{shipping.name}</p>
                                <p className="text-sm text-white/60">{shipping.line1}</p>
                                {shipping.line2 && <p className="text-sm text-white/60">{shipping.line2}</p>}
                                <p className="text-sm text-white/60">{shipping.city} {shipping.postal_code}</p>
                                <p className="text-sm text-white/60" dir="ltr">{shipping.phone}</p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            {!isSignedIn && (
                                <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 text-gold text-sm text-center">
                                    يجب تسجيل الدخول أولاً لإتمام الطلب
                                </div>
                            )}

                            <button
                                onClick={handleSubmitOrder}
                                disabled={isSubmitting || !isSignedIn}
                                className="btn-gold w-full py-4 flex items-center justify-center gap-2 text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <motion.div
                                            className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        />
                                        <span>جاري إنشاء الطلب...</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5" />
                                        <span>تأكيد الطلب — {total.toFixed(2)} ر.س</span>
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {/* ═══ Success ═══ */}
                    {step === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16 space-y-6"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.2, damping: 10 }}
                            >
                                <CheckCircle2 className="w-10 h-10 text-green-400" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h1 className="text-3xl font-bold text-white mb-2">تم الطلب بنجاح! 🎉</h1>
                                <p className="text-white/50 mb-2">شكراً لك، طلبك قيد التجهيز</p>
                            </motion.div>

                            <motion.div
                                className="glass-card inline-block px-8 py-5 space-y-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <p className="text-sm text-white/40">رقم الطلب</p>
                                <p className="text-2xl font-bold text-gold tracking-wider" dir="ltr">
                                    {orderNumber}
                                </p>
                                <p className="text-sm text-white/50">
                                    الإجمالي: <span className="text-white font-medium">{orderTotal.toFixed(2)} ر.س</span>
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                <Link
                                    href="/"
                                    className="btn-gold inline-flex items-center gap-2 px-8 py-3 mt-4"
                                >
                                    العودة للصفحة الرئيسية
                                </Link>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
