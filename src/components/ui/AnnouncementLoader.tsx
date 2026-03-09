import { getActiveAnnouncements } from "@/app/actions/announcements";
import { AnnouncementRenderer } from "@/components/ui/AnnouncementRenderer";

export async function AnnouncementLoader() {
    try {
        const announcements = await getActiveAnnouncements();
        if (!announcements.length) return null;
        return <AnnouncementRenderer announcements={announcements} />;
    } catch (error) {
        // Silently fail if Supabase is not configured (development mode)
        console.warn("AnnouncementLoader: Could not load announcements", error);
        return null;
    }
}
