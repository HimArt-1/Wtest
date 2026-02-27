import { getSiteSettings } from "@/app/actions/settings";
import { SettingsClient } from "./SettingsClient";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminSettingsPage() {
    const settings = await getSiteSettings();

    return (
        <div className="space-y-6">
            <AdminHeader
                title="إعدادات الموقع"
                subtitle="تحكم في إعدادات ومظهر الموقع بالكامل."
            />

            <SettingsClient settings={settings} />
        </div>
    );
}
