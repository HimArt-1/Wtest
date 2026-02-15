"use client";

import { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { ShoppingBag, Share2 } from "lucide-react";
import { motion } from "framer-motion";

export function ProductActions({ product }: { product: any }) {
    const addItem = useCartStore((s) => s.addItem);
    const [selectedSize, setSelectedSize] = useState<string>(
        product.sizes?.[0] || ""
    );

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: product.title,
                text: `${product.title} — وشّى`,
                url: window.location.href,
            });
        } else {
            await navigator.clipboard.writeText(window.location.href);
            alert("تم نسخ الرابط!");
        }
    };

    return (
        <div className="space-y-4">
            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
                <div>
                    <label className="text-xs text-fg/30 mb-2 block">اختر المقاس</label>
                    <div className="flex gap-2 flex-wrap">
                        {product.sizes.map((size: string) => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${selectedSize === size
                                        ? "bg-gold/10 border-gold/40 text-gold"
                                        : "border-white/[0.08] text-fg/40 hover:border-white/20"
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
                <motion.button
                    onClick={() => addItem({
                        id: product.id,
                        title: product.title,
                        price: Number(product.price),
                        image_url: product.image_url,
                        artist_name: product.artist?.display_name || "فنان وشّى",
                        type: "product",
                        size: selectedSize || null,
                        maxQuantity: product.stock_quantity || 99,
                    })}
                    disabled={!product.in_stock}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gold text-bg font-bold rounded-2xl hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    whileHover={product.in_stock ? { scale: 1.02 } : {}}
                    whileTap={product.in_stock ? { scale: 0.98 } : {}}
                >
                    <ShoppingBag className="w-4 h-4" />
                    {product.in_stock ? "أضف للسلة" : "غير متوفر"}
                </motion.button>
                <motion.button
                    onClick={handleShare}
                    className="p-3.5 border border-white/[0.08] rounded-2xl text-fg/40 hover:text-gold hover:border-gold/30 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Share2 className="w-5 h-5" />
                </motion.button>
            </div>
        </div>
    );
}
