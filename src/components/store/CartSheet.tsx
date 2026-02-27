"use client";

import { useCartStore } from "@/stores/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
export function CartSheet() {
    const { items, isOpen, toggleCart, removeItem, updateQuantity, getCartTotal } = useCartStore();

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
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-fg/20">
                                    <ShoppingBag className="w-16 h-16" />
                                    <p>السلة فارغة</p>
                                    <button
                                        onClick={() => toggleCart(false)}
                                        className="text-gold text-sm hover:underline"
                                    >
                                        تصفح المنتجات
                                    </button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <motion.div
                                        layout
                                        key={`${item.id}-${item.size}`}
                                        className="flex gap-4 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl group"
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
                            <div className="p-5 border-t border-white/[0.06] bg-surface space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-fg/60">المجموع</span>
                                    <span className="text-xl font-bold text-gold">{getCartTotal().toLocaleString()} ر.س</span>
                                </div>
                                <Link
                                    href="/checkout"
                                    onClick={() => toggleCart(false)}
                                    className="w-full flex items-center justify-center gap-2 bg-gold text-bg font-bold py-3.5 rounded-xl hover:bg-gold-light transition-colors"
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
