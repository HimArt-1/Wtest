import { getAdminInventory } from "@/app/actions/admin";
import { InventoryClient } from "@/components/admin/InventoryClient";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
    const data = await getAdminInventory("all");
    return (
        <div className="space-y-6">
            <AdminHeader
                title="إدارة المخزون"
                subtitle="مراقبة وتحديث كميات المنتجات وتنبيهات نقص المخزون"
            />
            <InventoryClient
                initialProducts={data.products}
                lowStockCount={data.lowStockCount}
                outOfStockCount={data.outOfStockCount}
            />
        </div>
    );
}
