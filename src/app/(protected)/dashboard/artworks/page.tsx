import { getAdminArtworks } from "@/app/actions/admin";
import { ArtworksClient } from "@/components/admin/ArtworksClient";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface PageProps {
    searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function AdminArtworksPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const status = params.status || "all";

    const { data: artworks, count, totalPages } = await getAdminArtworks(page, status);

    return (
        <div className="space-y-6">
            <AdminHeader
                title="إدارة الأعمال الفنية"
                subtitle="مراجعة ونشر وأرشفة الأعمال الفنية على المنصة."
            />

            <ArtworksClient
                artworks={artworks}
                count={count}
                totalPages={totalPages}
                currentPage={page}
                currentStatus={status}
            />
        </div>
    );
}
