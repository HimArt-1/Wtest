import { getAdminProducts, getAdminArtistsForSelect, getCategories } from "@/app/actions/settings";
import { getSKUs } from "@/app/actions/erp/inventory";
import { ProductsClient } from "./ProductsClient";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface PageProps {
    searchParams: { page?: string; type?: string };
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
    const page = Number(searchParams.page) || 1;
    const type = searchParams.type || "all";

    const [{ data: products, count, totalPages }, artists, { data: categories }, skusResult] = await Promise.all([
        getAdminProducts(page, type),
        getAdminArtistsForSelect(),
        getCategories(),
        getSKUs(),
    ]);

    const skus = (skusResult as any)?.skus || [];

    return (
        <div className="space-y-6">
            <AdminHeader
                title="إدارة المنتجات"
                subtitle="إدارة شاملة للمنتجات والمخزون والباركود والفئات."
            />

            <ProductsClient
                products={products}
                count={count}
                totalPages={totalPages}
                currentPage={page}
                currentType={type}
                artists={artists}
                categories={categories || []}
                skus={skus || []}
            />
        </div>
    );
}
