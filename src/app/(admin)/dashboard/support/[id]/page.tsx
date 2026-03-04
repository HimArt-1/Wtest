import { getSupportTicketDetails } from "@/app/actions/support-tickets";
import { AdminSupportTicketChat } from "@/components/admin/support/AdminSupportTicketChat";
import { notFound } from "next/navigation";

export const metadata = {
    title: "محادثة الدعم | لوحة التحكم",
};

export default async function AdminSupportTicketPage({ params }: { params: { id: string } }) {
    const details = await getSupportTicketDetails(params.id);

    if (!details) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">تذكرة #{details.ticket.id.slice(0, 8)}</h1>
            <AdminSupportTicketChat ticket={details.ticket} initialMessages={details.messages} />
        </div>
    );
}
