import { adminGetSupportTickets } from "@/app/actions/support-tickets";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SupportOpsCenter } from "@/components/ops/SupportOpsCenter";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "مركز الدعم الفني | لوحة الإدارة",
};

export default async function AdminSupportPage() {
    const tickets = await adminGetSupportTickets();

    return (
        <div className="space-y-6">
            <AdminHeader
                title="مركز الدعم الفني"
                subtitle="الصيانة · الفحص · التحليل · سجل الزيارات · داشبورد الأخطاء · الاتصال · الأمان والحماية المطلقة"
            />
            <SupportOpsCenter initialTickets={tickets} />
        </div>
    );
}
