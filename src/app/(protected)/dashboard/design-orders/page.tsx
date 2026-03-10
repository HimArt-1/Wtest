import { getDesignOrders, getDesignPromptTemplate, getDesignOrderStats, getAdminList } from "@/app/actions/smart-store";
import { DesignOrdersClient } from "@/components/admin/DesignOrdersClient";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { CustomDesignOrderStatus } from "@/types/database";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams?: Promise<{ page?: string; status?: string; admin?: string; search?: string }>;
}

export default async function DesignOrdersPage({ searchParams }: PageProps) {
    const params = (await searchParams) ?? {} as Record<string, string | undefined>;
    const page = Number(params.page) || 1;
    const status = (params.status || "all") as CustomDesignOrderStatus | "all";

    const [ordersResult, promptTemplate, stats, adminList] = await Promise.all([
        getDesignOrders(page, status),
        getDesignPromptTemplate(),
        getDesignOrderStats(),
        getAdminList(),
    ]);

    return (
        <div className="space-y-6">
            <AdminHeader
                title="طلبات التصميم"
                subtitle="إدارة طلبات التصميم المخصص — مراجعة ، تنفيذ ، تعيين ، وإرسال النتائج."
            />
            <DesignOrdersClient
                orders={ordersResult.data}
                count={ordersResult.count}
                totalPages={ordersResult.totalPages}
                currentPage={page}
                currentStatus={status}
                promptTemplate={promptTemplate}
                stats={stats}
                adminList={adminList}
            />
        </div>
    );
}
