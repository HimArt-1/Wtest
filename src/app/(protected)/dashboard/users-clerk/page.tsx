import { getClerkUsersList } from "@/app/actions/clerk-users";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ClerkUsersClient } from "@/components/admin/ClerkUsersClient";

interface PageProps {
    searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function ClerkUsersPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const search = params.search || "";

    const { data, totalCount, totalPages } = await getClerkUsersList(page, search);

    return (
        <div className="space-y-6">
            <AdminHeader
                title="مستخدمي Clerk"
                subtitle="عرض جميع المستخدمين المسجلين في نظام المصادقة مع بياناتهم من المنصة."
            />

            <ClerkUsersClient
                users={data}
                totalCount={totalCount}
                totalPages={totalPages}
                currentPage={page}
                currentSearch={search}
            />
        </div>
    );
}
