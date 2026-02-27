import { getNewsletterSubscribers } from "@/app/actions/settings";
import { NewsletterClient } from "./NewsletterClient";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminNewsletterPage() {
    const { data: subscribers } = await getNewsletterSubscribers();

    return (
        <div className="space-y-6">
            <AdminHeader
                title="إدارة المشتركين"
                subtitle="عرض وإدارة مشتركي النشرة البريدية."
            />

            <NewsletterClient subscribers={subscribers} />
        </div>
    );
}
