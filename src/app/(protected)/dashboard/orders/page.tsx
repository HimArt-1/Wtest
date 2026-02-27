import { getAdminOrders } from "@/app/actions/admin";
import { OrdersClient } from "@/components/admin/OrdersClient";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams?: { page?: string; status?: string };
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
    const params = searchParams ?? {};
    const page = Number(params.page) || 1;
    const status = params.status || "all";

    let orders: any[] = [];
    let count = 0;
    let totalPages = 0;
    try {
        const result = await getAdminOrders(page, status);
        orders = result.data ?? [];
        count = result.count ?? 0;
        totalPages = result.totalPages ?? 0;
    } catch (err) {
        console.error("[Orders] Error:", err);
    }

    return (
        <div className="space-y-6">
            <AdminHeader
                title="إدارة الطلبات"
                subtitle="تتبع وإدارة جميع الطلبات على المنصة."
            />

            <OrdersClient
                orders={orders}
                count={count}
                totalPages={totalPages}
                currentPage={page}
                currentStatus={status}
            />
        </div>
    );
}
