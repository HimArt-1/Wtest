// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — Analytics Actions
//  Server Actions الخاصة بلوحة تحكم المبيعات الإحصائية
// ═══════════════════════════════════════════════════════════

"use server";

import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { Database } from "@/types/database";

// نحتاج حساب المسؤول فقط للاطلاع على هذه البيانات
function getAdminSb() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}

// دالة مساعدة للتحقق من صلاحية الإدارة
async function verifyAdmin() {
    const user = await currentUser();
    if (!user) return false;

    const supabase = getAdminSb();
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("clerk_id", user.id)
        .single();

    return (profile as any)?.role === "admin";
}

export async function getDashboardStats() {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) return { error: "غير مصرح لك بعرض هذه البيانات" };

    try {
        const supabase = getAdminSb();

        // إجمالي المبيعات والطلبات للإحصاءات السريعة
        const { data: orders, error: ordersError } = await supabase
            .from("orders")
            .select("total, created_at, status") as any;

        if (ordersError) throw ordersError;

        // إجمالي المستخدمين (المشتركين)
        const { count: usersCount, error: usersError } = await supabase
            .from("profiles")
            .select("*", { count: 'exact', head: true });

        if (usersError) throw usersError;

        // الحسابات
        // 1. حساب الإيرادات (طلبات مؤكدة أو مُسلّمة فقط أو قيد التنفيذ - نستثني الملغاة)
        const validOrders = orders.filter(
            (o: any) => o.status !== "cancelled" && o.status !== "refunded"
        );
        const totalRevenue = validOrders.reduce((sum: number, order: any) => sum + order.total, 0);
        const totalOrders = validOrders.length;

        // 2. تجميع الإيرادات للأيام السبعة الماضية للرسم البياني
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split("T")[0]; // YYYY-MM-DD
        }).reverse();

        const revenueByDay = last7Days.map((dateStr) => {
            const dayOrders = validOrders.filter(
                (o: any) => o.created_at.startsWith(dateStr)
            );
            const dayTotal = dayOrders.reduce((sum: number, o: any) => sum + o.total, 0);

            // تحويل التاريخ من YYYY-MM-DD إلى صيغة عرض مبسطة للعربي
            const dateObj = new Date(dateStr);
            const displayDate = new Intl.DateTimeFormat('ar-SA', { weekday: 'short', day: 'numeric' }).format(dateObj);

            return {
                date: displayDate,
                revenue: dayTotal,
                orders: dayOrders.length
            };
        });

        return {
            stats: {
                totalRevenue,
                totalOrders,
                totalUsers: usersCount || 0,
            },
            chartData: revenueByDay,
        };
    } catch (err: unknown) {
        console.error("[getDashboardStats]", err);
        return { error: "فشل في جلب بيانات الإحصائيات" };
    }
}
