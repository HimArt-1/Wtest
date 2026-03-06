import { getInventoryLevels, getWarehouses, getSKUs } from "@/app/actions/erp/inventory";
import InventoryClient from "@/components/admin/erp/InventoryClient";

export const metadata = {
    title: "المخزون - وشّى | WUSHA",
};

export default async function InventoryPage() {
    const [invRes, whRes, skusRes] = await Promise.all([
        getInventoryLevels(),
        getWarehouses(),
        getSKUs()
    ]);

    if (invRes.error || whRes.error || skusRes.error) {
        return (
            <div className="p-8 text-center text-red-400">
                <p>خطأ في جلب بيانات المخزون</p>
            </div>
        );
    }

    return (
        <main className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-fg">إدارة المخزون</h1>
                <p className="text-fg/60">
                    تتبع مستويات المخزون، قم بإضافة كميات جديدة، واطلع على حركات المستودعات.
                </p>
            </header>

            <InventoryClient
                initialInventory={invRes.inventory || []}
                warehouses={whRes.warehouses || []}
                skus={skusRes.skus || []}
            />
        </main>
    );
}
