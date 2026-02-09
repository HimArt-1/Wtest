"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormData } from "@/lib/validations";
import { updateProfile } from "@/app/actions/profile";
import { useState, useTransition } from "react";
import { Loader2, Save, AtSign, Globe, Instagram, Twitter, Youtube, Dribbble } from "lucide-react";

interface ProfileFormProps {
    initialData?: Partial<ProfileFormData>;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [isPending, startTransition] = useTransition();
    const [state, setState] = useState<{ message?: string; success?: boolean; errors?: any }>({});

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            display_name: initialData?.display_name || "",
            username: initialData?.username || "",
            bio: initialData?.bio || "",
            website: initialData?.website || "",
            avatar_url: initialData?.avatar_url || "",
            cover_url: initialData?.cover_url || "",
            social_links: {
                instagram: initialData?.social_links?.instagram || "",
                twitter: initialData?.social_links?.twitter || "",
                youtube: initialData?.social_links?.youtube || "",
                behance: initialData?.social_links?.behance || "",
                dribbble: initialData?.social_links?.dribbble || "",
            }
        },
    });

    const onSubmit = (data: ProfileFormData) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("display_name", data.display_name);
            formData.append("username", data.username);

            if (data.bio) formData.append("bio", data.bio);
            if (data.website) formData.append("website", data.website);
            // Handling Avatar/Cover typically involves file upload first, then updating URL. 
            // For this form, we assume URLs are handled or just text inputs for testing.

            if (data.social_links?.instagram) formData.append("social.instagram", data.social_links.instagram);
            if (data.social_links?.twitter) formData.append("social.twitter", data.social_links.twitter);
            if (data.social_links?.youtube) formData.append("social.youtube", data.social_links.youtube);
            if (data.social_links?.behance) formData.append("social.behance", data.social_links.behance);
            if (data.social_links?.dribbble) formData.append("social.dribbble", data.social_links.dribbble);

            const result = await updateProfile({}, formData);
            setState(result);
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
            {/* Success/Error Message */}
            {state.message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${state.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {state.message}
                </div>
            )}

            {/* Basic Info */}
            <div className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm space-y-6">
                <h3 className="text-lg font-bold border-b border-ink/5 pb-4">البيانات الأساسية</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-ink/80 mb-2">الاسم المعروض</label>
                        <input
                            {...register("display_name")}
                            className="w-full p-3 rounded-xl bg-sand/20 border border-ink/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
                            placeholder="اسمك الفني أو الحقيقي"
                        />
                        {errors.display_name && <p className="text-red-500 text-xs mt-1">{errors.display_name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-ink/80 mb-2">اسم المستخدم</label>
                        <div className="relative">
                            <AtSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                            <input
                                {...register("username")}
                                className="w-full p-3 pr-10 rounded-xl bg-sand/20 border border-ink/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all dir-ltr text-right"
                                placeholder="username"
                            />
                        </div>
                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                        {state.errors?.username && <p className="text-red-500 text-xs mt-1">{state.errors.username[0]}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-ink/80 mb-2">نبذة عنك (Bio)</label>
                    <textarea
                        {...register("bio")}
                        className="w-full h-32 p-3 rounded-xl bg-sand/20 border border-ink/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none resize-none transition-all"
                        placeholder="اخبرنا قليلاً عن نفسك وفنك..."
                    />
                    {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
                </div>
            </div>

            {/* Social Links */}
            <div className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm space-y-6">
                <h3 className="text-lg font-bold border-b border-ink/5 pb-4">التواجد الرقمي</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-ink/80 mb-2">
                            <Globe className="w-4 h-4" /> الموقع الشخصي
                        </label>
                        <input
                            {...register("website")}
                            className="w-full p-3 rounded-xl bg-sand/20 border border-ink/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all dir-ltr"
                            placeholder="https://your-portfolio.com"
                        />
                        {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-ink/80 mb-2">
                            <Instagram className="w-4 h-4" /> انستجرام
                        </label>
                        <input
                            {...register("social_links.instagram")}
                            className="w-full p-3 rounded-xl bg-sand/20 border border-ink/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all dir-ltr"
                            placeholder="@username or URL"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-ink/80 mb-2">
                            <Twitter className="w-4 h-4" /> تويتر / X
                        </label>
                        <input
                            {...register("social_links.twitter")}
                            className="w-full p-3 rounded-xl bg-sand/20 border border-ink/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all dir-ltr"
                            placeholder="@username or URL"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-ink/80 mb-2">
                            <Dribbble className="w-4 h-4" /> Dribbble
                        </label>
                        <input
                            {...register("social_links.dribbble")}
                            className="w-full p-3 rounded-xl bg-sand/20 border border-ink/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all dir-ltr"
                            placeholder="@username or URL"
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="btn-gold px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-gold/20"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري الحفظ...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            حفظ التغييرات
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
