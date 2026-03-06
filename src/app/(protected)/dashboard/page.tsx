import { getAdminOverview, getAdminAnalytics, getAdminInventory } from "@/app/actions/admin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";
import { DashboardClient } from "./DashboardClient";

export default async function AdminDashboardPage() {
    const [overview, analytics, inventory] = await Promise.all([
        getAdminOverview(),
        getAdminAnalytics("7d"),
        getAdminInventory("low"),
    ]);

    const { stats, recentOrders, pendingApplications } = overview;

    return (
        <div className="space-y-8">
            <AdminHeader
                title="لوحة المؤشرات"
                subtitle="ملخص شامل لأداء المنصة — الإيرادات والطلبات والمخزون والعملاء."
                actions={<AdminQuickActions pendingCount={stats.pendingApplications} />}
            />
            <DashboardClient
                stats={stats}
                recentOrders={recentOrders}
                pendingApplications={pendingApplications}
                topProducts={analytics.topProducts.slice(0, 5)}
                revenueByDay={analytics.revenueByDay}
                lowStockProducts={inventory.products.slice(0, 5)}
                lowStockCount={inventory.lowStockCount}
            />
        </div>
    );
}
