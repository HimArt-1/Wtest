"use client";

import { motion } from 'framer-motion';
import { Package, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { TopProduct } from '@/app/actions/analytics';

interface TopProductsListProps {
    products: TopProduct[];
}

export default function TopProductsList({ products }: TopProductsListProps) {
    if (!products || products.length === 0) {
        return (
            <div className="w-full bg-[#0F0F0F]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[300px]">
                <Package className="w-12 h-12 text-theme-faint mb-4" />
                <p className="text-theme-subtle">لا توجد مبيعات كافية لعرض المنتجات الأكثر مبيعاً</p>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[#0F0F0F]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col h-full"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-gold" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">الأكثر مبيعاً</h3>
                    <p className="text-theme-subtle text-xs">أفضل 5 منتجات من حيث المبيعات المكتملة</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {products.map((product, index) => (
                    <div 
                        key={product.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-gold/30 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-black text-theme-faint group-hover:text-gold/50 transition-colors w-6">
                                {index + 1}
                            </span>
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/50 border border-white/10 shrink-0">
                                {product.image_url ? (
                                    <Image 
                                        src={product.image_url} 
                                        alt={product.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-5 h-5 text-theme-faint" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-white font-medium text-sm line-clamp-1">{product.title}</h4>
                                <p className="text-theme-subtle text-xs mt-1">{product.total_sold} وحدة مباعة</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <span className="block text-gold font-bold text-sm">
                                {new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(product.revenue)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
