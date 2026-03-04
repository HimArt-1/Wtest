import { adminGetSupportTickets } from "@/app/actions/support-tickets";
import { AdminSupportDashboardClient } from "@/components/admin/support/AdminSupportDashboardClient";

export const metadata = {
    title: "إدارة تذاكر الدعم | لوحة التحكم",
};

export default async function AdminSupportPage() {
    const tickets = await adminGetSupportTickets();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">تذاكر الدعم الفني</h1>
                    <p className="text-white/50 text-sm mt-1">إدارة تذاكر المستخدمين والتواصل معهم</p>
                </div>
            </div>

            <AdminSupportDashboardClient initialTickets={tickets} />
        </div>
    );
}
