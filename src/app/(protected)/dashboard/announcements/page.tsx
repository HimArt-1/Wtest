import { AdminHeader } from "@/components/admin/AdminHeader";
import { getAnnouncementEngagementSnapshot, getAnnouncements } from "@/app/actions/announcements";
import { AnnouncementsClient } from "./AnnouncementsClient";

export const metadata = {
    title: "إدارة الإعلانات | لوحة الإدارة",
};

export default async function AnnouncementsPage() {
    const [announcements, engagement] = await Promise.all([
        getAnnouncements(),
        getAnnouncementEngagementSnapshot(),
    ]);

    return (
        <div className="space-y-6">
            <AdminHeader
                title="إدارة الإعلانات والعروض"
                subtitle="تشغيل الحملات، جدولة الإطلاقات، ومراقبة تعارضات الظهور عبر الواجهة العامة."
            />
            <AnnouncementsClient announcements={announcements} engagement={engagement} />
        </div>
    );
}
