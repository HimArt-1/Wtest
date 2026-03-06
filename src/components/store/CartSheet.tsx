"use client";

import { useCartStore } from "@/stores/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { validateDiscountCoupon } from "@/app/actions/discount-coupons";
export function CartSheet() {
    const {
        items, isOpen, toggleCart, removeItem, updateQuantity,
        getCartTotal, coupon, applyCoupon, removeCoupon,
        getSubtotal, getDiscountAmount
    } = useCartStore();

    const [promoCode, setPromoCode] = useState("");
    const [promoError, setPromoError] = useState("");
    const [isValidating, setIsValidating] = useState(false);

    const handleApplyPromo = async () => {
        setPromoError("");
        if (!promoCode.trim()) return;

        setIsValidating(true);
        const res = await validateDiscountCoupon(promoCode);
        setIsValidating(false);

        if (res.error) {
            setPromoError(res.error);
        } else if (res.data) {
            applyCoupon(res.data);
            setPromoCode("");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => toggleCart(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-surface border-l border-white/[0.06] shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-gold" />
                                <h2 className="text-lg font-bold text-fg">سلة المشتريات</h2>
                                <span className="bg-white/5 text-fg/40 text-xs px-2 py-0.5 rounded-full font-mono">
                                    {items.length}
                                </span>
                            </div>
                            <button
                                onClick={() => toggleCart(false)}
                                className="p-2 hover:bg-white/5 rounded-lg text-fg/40 hover:text-fg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {items.length === 0 ? (
                                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center space-y-5 py-12">
                                    <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                        <ShoppingBag className="w-10 h-10 text-fg/20" />
                                    </div>
                                    <div>
                                        <p className="text-fg/40 font-medium">السلة فارغة</p>
                                        <p className="text-fg/20 text-sm mt-1">أضف منتجات من المتجر لتبدأ</p>
                                    </div>
                                    <Link
                                        href="/store"
                                        onClick={() => toggleCart(false)}
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gold/30 text-gold text-sm font-medium hover:bg-gold/10 transition-colors"
                                    >
                                        تصفح المتجر
                                    </Link>
                                </div>
                            ) : (
                                items.map((item, i) => (
                                    <motion.div
                                        layout
                                        key={`${item.id}-${item.size}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex gap-4 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl group hover:border-white/[0.08] transition-colors"
                                    >
                                        {/* Image */}
                                        <div className="relative w-20 h-20 bg-white/5 rounded-lg overflow-hidden shrink-0">
                                            <Image
                                                src={item.image_url}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start gap-2">
                                                    <h3 className="font-bold text-fg text-sm truncate">{item.title}</h3>
                                                    <button
                                                        onClick={() => removeItem(item.id, item.size)}
                                                        className="text-fg/20 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-fg/40 text-xs truncate">{item.artist_name}</p>
                                                {item.size && (
                                                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-fg/60">
                                                        {item.size}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-gold text-sm">
                                                    {item.price.toLocaleString()} ر.س
                                                </span>

                                                {/* Qty Controls */}
                                                <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                                                        className="text-fg/40 hover:text-fg disabled:opacity-30"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                                                        className="text-fg/40 hover:text-fg disabled:opacity-30"
                                                        disabled={item.maxQuantity ? item.quantity >= item.maxQuantity : false}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-5 border-t border-white/[0.06] bg-surface/80 backdrop-blur-sm space-y-4">

                                {/* Promo Code Section */}
                                <div className="space-y-2">
                                    {!coupon ? (
                                        <>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="كود الخصم"
                                                    value={promoCode}
                                                    onChange={(e) => setPromoCode(e.target.value)}
                                                    className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 text-sm focus:outline-none focus:border-gold/50 transition-colors uppercase"
                                                />
                                                <button
                                                    onClick={handleApplyPromo}
                                                    disabled={isValidating || !promoCode.trim()}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gold text-sm font-medium rounded-xl transition-colors disabled:opacity-50 min-w-[#80px]"
                                                >
                                                    {isValidating ? "جاري التحقق..." : "تطبيق"}
                                                </button>
                                            </div>
                                            {promoError && (
                                                <p className="text-red-400 text-xs px-1">{promoError}</p>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 bg-gold/10 border border-gold/20 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                                                    <span className="text-gold font-bold">%</span>
                                                </div>
                                                <div>
                                                    <p className="text-gold font-medium text-sm">تم تفعيل كود الخصم!</p>
                                                    <p className="text-gold/60 text-xs font-mono uppercase">{coupon.code}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={removeCoupon}
                                                className="text-gold/60 hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 pt-2 border-t border-white/[0.03]">
                                    <div className="flex items-center justify-between text-sm text-fg/60">
                                        <span>المجموع الفرعي</span>
                                        <span>{getSubtotal().toLocaleString()} ر.س</span>
                                    </div>

                                    {coupon && (
                                        <div className="flex items-center justify-between text-sm text-green-400">
                                            <span>الخصم ({coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} ر.س`})</span>
                                            <span>-{getDiscountAmount().toLocaleString()} ر.س</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-fg font-bold">المجموع الإجمالي</span>
                                        <span className="text-xl font-bold text-gold">{getCartTotal().toLocaleString()} ر.س</span>
                                    </div>
                                </div>

                                <Link
                                    href="/checkout"
                                    onClick={() => toggleCart(false)}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold/90 text-bg font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 mt-2"
                                >
                                    إتمام الشراء
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
