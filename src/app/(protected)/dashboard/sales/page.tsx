import { getAdminSales } from "@/app/actions/admin";
import { SalesClient } from "@/components/admin/SalesClient";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
    const data = await getAdminSales("30d");
    return (
        <div className="space-y-6">
            <AdminHeader
                title="إدارة المبيعات"
                subtitle="متابعة المبيعات والإيرادات حسب المنتج والفترة"
            />
            <SalesClient initialData={data} />
        </div>
    );
}
