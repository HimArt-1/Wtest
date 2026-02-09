import { getProfile } from "@/app/actions/profile";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { type ProfileFormData } from "@/lib/validations";

export default async function SettingsPage() {
    const profile = await getProfile();

    // Map DB profile to form data structure
    const initialData: Partial<ProfileFormData> = {
        display_name: profile?.display_name || "",
        username: profile?.username || "",
        bio: profile?.bio || "",
        website: profile?.website || "",
        avatar_url: profile?.avatar_url || "",
        cover_url: profile?.cover_url || "",
        social_links: profile?.social_links || {},
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-ink">إعدادات الملف الشخصي</h1>
                <p className="text-ink/60 mt-2">قم بتحديث بياناتك لتظهر بشكل احترافي في معرضك الخاص</p>
            </div>

            <ProfileForm initialData={initialData} />
        </div>
    );
}
