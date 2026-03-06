import { adminGetSupportTickets } from "@/app/actions/support-tickets";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SupportDashboardPro } from "./SupportDashboardPro";

export const metadata = {
    title: "الدعم الفني | لوحة الإدارة",
};

export default async function AdminSupportPage() {
    const tickets = await adminGetSupportTickets();

    return (
        <div className="space-y-6">
            <AdminHeader
                title="الدعم الفني"
                subtitle="إدارة تذاكر الدعم والتواصل مع العملاء وحل المشكلات."
            />
            <SupportDashboardPro initialTickets={tickets} />
        </div>
    );
}
