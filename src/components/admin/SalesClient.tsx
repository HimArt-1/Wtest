"use client";

import { useState } from "react";
import { getAdminSales } from "@/app/actions/admin";
import { DollarSign, Package, TrendingUp } from "lucide-react";

const PERIODS = [
    { id: "7d" as const, label: "7 أيام" },
    { id: "30d" as const, label: "30 يوماً" },
    { id: "90d" as const, label: "90 يوماً" },
];

interface SalesClientProps {
    initialData: {
        totalRevenue: number;
        totalOrders: number;
        salesByProduct: { productId: string; title: string; quantity: number; revenue: number }[];
        orders: any[];
    };
}

export function SalesClient({ initialData }: SalesClientProps) {
    const [data, setData] = useState(initialData);
    const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
    const [loading, setLoading] = useState(false);

    const handlePeriodChange = async (p: "7d" | "30d" | "90d") => {
        setPeriod(p);
        setLoading(true);
        const result = await getAdminSales(p);
        setData(result);
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                {PERIODS.map((pr) => (
                    <button
                        key={pr.id}
                        onClick={() => handlePeriodChange(pr.id)}
                        disabled={loading}
                        className={`px-4 py-2 rounded-xl text-sm font-medium ${
                            period === pr.id ? "bg-gold/20 text-gold border border-gold/40" : "bg-white/5 text-fg/60 border border-white/10"
                        }`}
                    >
                        {pr.label}
                    </button>
                ))}
            </div>

            {/* ملخص */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2 text-fg/50 text-sm mb-1">
                        <DollarSign className="w-4 h-4" />
                        إجمالي المبيعات
                    </div>
                    <p className="text-2xl font-bold text-gold">{data.totalRevenue.toLocaleString()} ر.س</p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2 text-fg/50 text-sm mb-1">
                        <Package className="w-4 h-4" />
                        عدد الطلبات
                    </div>
                    <p className="text-2xl font-bold text-fg">{data.totalOrders}</p>
                </div>
            </div>

            {/* المبيعات حسب المنتج */}
            <div className="rounded-2xl border border-white/[0.06] bg-surface/50 p-6">
                <h2 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-gold" />
                    المبيعات حسب المنتج
                </h2>
                {data.salesByProduct.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-fg/50 border-b border-white/10">
                                    <th className="text-right py-3 px-4">#</th>
                                    <th className="text-right py-3 px-4">المنتج</th>
                                    <th className="text-right py-3 px-4">الكمية المباعة</th>
                                    <th className="text-right py-3 px-4">الإيرادات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.salesByProduct.map((sp, i) => (
                                    <tr key={sp.productId} className="border-b border-white/5">
                                        <td className="py-3 px-4 text-fg/60">{i + 1}</td>
                                        <td className="py-3 px-4 font-medium text-fg">{sp.title}</td>
                                        <td className="py-3 px-4 text-fg/80">{sp.quantity}</td>
                                        <td className="py-3 px-4 text-gold font-bold">{sp.revenue.toLocaleString()} ر.س</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-fg/50 text-sm py-12 text-center">لا توجد مبيعات في الفترة المحددة</p>
                )}
            </div>
        </div>
    );
}
