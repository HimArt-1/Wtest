import { getCategories } from "@/app/actions/settings";
import { CategoriesClient } from "./CategoriesClient";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminCategoriesPage() {
    const { data: categories } = await getCategories();

    return (
        <div className="space-y-6">
            <AdminHeader
                title="إدارة الفئات"
                subtitle="إضافة وتعديل وحذف فئات الأعمال الفنية."
            />

            <CategoriesClient categories={categories} />
        </div>
    );
}
