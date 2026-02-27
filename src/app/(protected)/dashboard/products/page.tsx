import { getAdminProducts, getAdminArtistsForSelect } from "@/app/actions/settings";
import { ProductsClient } from "./ProductsClient";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface PageProps {
    searchParams: Promise<{ page?: string; type?: string }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const type = params.type || "all";

    const [{ data: products, count, totalPages }, artists] = await Promise.all([
        getAdminProducts(page, type),
        getAdminArtistsForSelect(),
    ]);

    return (
        <div className="space-y-6">
            <AdminHeader
                title="إدارة المنتجات"
                subtitle="عرض وإضافة وتعديل وحذف المنتجات والأسعار والمخزون."
            />

            <ProductsClient
                products={products}
                count={count}
                totalPages={totalPages}
                currentPage={page}
                currentType={type}
                artists={artists}
            />
        </div>
    );
}
