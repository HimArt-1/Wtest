import { getAdminApplications } from "@/app/actions/admin";
import { ApplicationsClient } from "@/components/admin/ApplicationsClient";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface PageProps {
    searchParams?: { status?: string };
}

export default async function AdminApplicationsPage({ searchParams }: PageProps) {
    const params = searchParams ?? {};
    const status = params.status || "all";

    let applications: any[] = [];
    let count = 0;
    try {
        const result = await getAdminApplications(status);
        applications = result.data ?? [];
        count = result.count ?? 0;
    } catch (err) {
        console.error("[Applications] Error:", err);
    }

    return (
        <div className="space-y-6">
            <AdminHeader
                title="طلبات الانضمام"
                subtitle="مراجعة وإدارة طلبات الانضمام كمشترك أو وشّاي."
            />

            <ApplicationsClient
                applications={applications}
                count={count}
                currentStatus={status}
            />
        </div>
    );
}
