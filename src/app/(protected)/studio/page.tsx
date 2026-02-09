import { Suspense } from "react";
import { getArtworks } from "@/app/actions/artworks"; // Reusing existing action for now
import { Eye, Heart, TrendingUp, DollarSign } from "lucide-react";

export default async function StudioDashboard() {
    // Mock data for now until we have real stats tables
    const stats = [
        { title: "إجمالي المبيعات", value: "12,450 SAR", icon: DollarSign, change: "+12%" },
        { title: "المشاهدات", value: "45.2K", icon: Eye, change: "+8%" },
        { title: "الإعجابات", value: "1,203", icon: Heart, change: "+24%" },
        { title: "معدل التحويل", value: "3.2%", icon: TrendingUp, change: "+2%" },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-ink">لوحة التحكم</h1>
                <p className="text-ink/60 mt-2">مرحباً بك في استوديو وشّى، إليك ملخص نشاطك.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gold/10 rounded-xl text-gold">
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-ink/60 text-sm font-medium">{stat.title}</h3>
                        <p className="text-2xl font-bold text-ink mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent Activity / Content Placeholder */}
            <div className="bg-white rounded-3xl border border-ink/5 p-8 min-h-[400px] flex items-center justify-center text-ink/40">
                <p>النشاطات الأخيرة (قريباً)</p>
            </div>
        </div>
    );
}
