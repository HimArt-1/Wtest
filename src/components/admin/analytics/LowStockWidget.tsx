"use client";

import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Package } from 'lucide-react';
import Image from 'next/image';
import { LowStockItem } from '@/app/actions/analytics';
import Link from 'next/link';

interface LowStockWidgetProps {
    items: LowStockItem[];
}

export default function LowStockWidget({ items }: LowStockWidgetProps) {
    if (!items || items.length === 0) {
        return (
            <div className="w-full bg-[#0F0F0F]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-emerald-500/50" />
                </div>
                <h3 className="text-emerald-400 font-bold text-lg mb-1">المخزون ممتاز</h3>
                <p className="text-theme-subtle text-sm text-center">جميع المنتجات متوفرة بكميات آمنة حالياً ولا توجد نواقص.</p>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[#0F0F0F]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col h-full relative overflow-hidden"
        >
            {/* Subtle Warning Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">تنبيهات المخزون</h3>
                        <p className="text-theme-subtle text-xs">منتجات قاربت على النفاذ تحتاج لتدخل سريع</p>
                    </div>
                </div>
                
                <span className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30">
                    {items.length} تنبيهات
                </span>
            </div>

            <div className="relative z-10 flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => {
                    const isCritical = item.quantity <= 2;
                    
                    return (
                        <div 
                            key={item.id}
                            className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
                                isCritical 
                                ? "bg-red-500/5 border-red-500/20 hover:border-red-500/50" 
                                : "bg-white/5 border-white/5 hover:border-gold/30"
                            }`}
                        >
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/50 border border-white/10 shrink-0 mt-1">
                                {item.product.image_url ? (
                                    <Image 
                                        src={item.product.image_url} 
                                        alt={item.product.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-5 h-5 text-theme-faint" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm line-clamp-1">{item.product.title}</h4>
                                <div className="flex items-center gap-2 mt-1.5 text-xs text-theme-subtle">
                                    <span className="font-mono text-xs">{item.sku}</span>
                                    <span>•</span>
                                    <span>مقاس {item.size}</span>
                                </div>
                                <div className="text-xs text-theme-faint mt-1">
                                    {item.warehouse.name}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className={`font-bold text-lg ${isCritical ? 'text-red-400' : 'text-gold'}`}>
                                    {item.quantity}
                                </span>
                                {isCritical && (
                                    <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="relative z-10 mt-6 pt-4 border-t border-white/5">
                <Link 
                    href="/dashboard/products-inventory" 
                    className="block w-full text-center text-sm text-theme-subtle hover:text-white transition-colors"
                >
                    إدارة المخزون بالكامل &rarr;
                </Link>
            </div>
        </motion.div>
    );
}
