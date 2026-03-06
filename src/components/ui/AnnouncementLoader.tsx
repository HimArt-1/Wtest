import { getActiveAnnouncements } from "@/app/actions/announcements";
import { AnnouncementRenderer } from "@/components/ui/AnnouncementRenderer";

export async function AnnouncementLoader() {
    const announcements = await getActiveAnnouncements();
    if (!announcements.length) return null;
    return <AnnouncementRenderer announcements={announcements} />;
}
