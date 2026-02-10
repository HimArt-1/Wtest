"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";

export function CartDrawer() {
    const { items, isOpen, setCartOpen, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCartStore();

    const itemCount = totalItems();
    const subtotal = totalPrice();
    const shipping = itemCount > 0 ? 30 : 0;
    const tax = subtotal * 0.15;
    const total = subtotal + shipping + tax;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* ═══ Backdrop ═══ */}
                    <motion.div
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setCartOpen(false)}
                    />

                    {/* ═══ Drawer Panel ═══ */}
                    <motion.div
                        className="fixed top-0 left-0 bottom-0 z-[70] w-full max-w-md bg-[#0c0c0c] border-r border-gold/10 shadow-2xl flex flex-col"
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        dir="rtl"
                    >
                        {/* ─── Header ─── */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5 text-gold" />
                                <h2 className="text-lg font-bold text-white">
                                    سلة المشتريات
                                    {itemCount > 0 && (
                                        <span className="mr-2 text-sm font-normal text-white/50">
                                            ({itemCount})
                                        </span>
                                    )}
                                </h2>
                            </div>
                            <button
                                onClick={() => setCartOpen(false)}
                                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                                aria-label="إغلاق"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* ─── Items List ─── */}
                        {itemCount === 0 ? (
                            /* Empty State */
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center"
                                >
                                    <ShoppingBag className="w-8 h-8 text-white/20" />
                                </motion.div>
                                <p className="text-white/40 text-sm">سلتك فارغة</p>
                                <p className="text-white/25 text-xs">اكتشف منتجاتنا وأضف ما يعجبك</p>
                                <button
                                    onClick={() => setCartOpen(false)}
                                    className="mt-4 btn-gold text-sm px-6 py-2.5"
                                >
                                    تصفح المنتجات
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                                <AnimatePresence initial={false}>
                                    {items.map((item) => (
                                        <motion.div
                                            key={`${item.product_id}-${item.size}`}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0, padding: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="glass-card p-3 flex gap-3"
                                        >
                                            {/* Product Image */}
                                            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                                <Image
                                                    src={item.image_url}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="80px"
                                                />
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-medium text-white truncate">
                                                    {item.title}
                                                </h3>
                                                <p className="text-xs text-white/40 mt-0.5">
                                                    {item.artist_name}
                                                </p>
                                                {item.size && (
                                                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                                                        {item.size}
                                                    </span>
                                                )}

                                                <div className="flex items-center justify-between mt-2">
                                                    {/* Price */}
                                                    <span className="text-sm font-bold text-gold">
                                                        {item.price * item.quantity} {item.currency === "SAR" ? "ر.س" : item.currency}
                                                    </span>

                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.size)}
                                                            className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                                            aria-label="أقل"
                                                        >
                                                            {item.quantity === 1 ? (
                                                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                            ) : (
                                                                <Minus className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                        <span className="w-6 text-center text-sm text-white font-medium">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.size)}
                                                            className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                                            aria-label="أكثر"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* ─── Footer / Summary ─── */}
                        {itemCount > 0 && (
                            <div className="border-t border-white/10 p-5 space-y-3">
                                {/* Price Breakdown */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-white/50">
                                        <span>المجموع الفرعي</span>
                                        <span>{subtotal.toFixed(2)} ر.س</span>
                                    </div>
                                    <div className="flex justify-between text-white/50">
                                        <span>الشحن</span>
                                        <span>{shipping.toFixed(2)} ر.س</span>
                                    </div>
                                    <div className="flex justify-between text-white/50">
                                        <span>الضريبة (15%)</span>
                                        <span>{tax.toFixed(2)} ر.س</span>
                                    </div>
                                    <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/10">
                                        <span>الإجمالي</span>
                                        <span className="text-gold">{total.toFixed(2)} ر.س</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <Link
                                    href="/checkout"
                                    onClick={() => setCartOpen(false)}
                                    className="btn-gold w-full flex items-center justify-center gap-2 py-3"
                                >
                                    <span>إتمام الشراء</span>
                                    <ArrowLeft className="w-4 h-4" />
                                </Link>

                                <button
                                    onClick={clearCart}
                                    className="w-full text-center text-xs text-white/30 hover:text-red-400 transition-colors py-2"
                                >
                                    تفريغ السلة
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
