import { getAdminUsers, getAdminUsersStats } from "@/app/actions/admin";
import { UsersClient } from "@/components/admin/UsersClient";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface PageProps {
    searchParams: Promise<{ page?: string; role?: string; search?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const role = params.role || "all";
    const search = params.search || "";

    const [{ data: users, count, totalPages }, stats] = await Promise.all([
        getAdminUsers(page, role, search),
        getAdminUsersStats(),
    ]);

    return (
        <div className="space-y-6">
            <AdminHeader
                title="إدارة المستخدمين"
                subtitle="عرض وإدارة وإضافة وتعديل وحذف المستخدمين على المنصة."
            />

            <UsersClient
                users={users}
                count={count}
                totalPages={totalPages}
                currentPage={page}
                currentRole={role}
                currentSearch={search}
                stats={stats}
            />
        </div>
    );
}
