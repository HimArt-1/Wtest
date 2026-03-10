import { Hero } from "@/components/sections/Hero";
import { AISection } from "@/components/sections/AISection";
import { getPublicVisibility } from "@/app/actions/settings";
import { PublicPageWrapper } from "@/components/layout/PublicPageWrapper";

export default async function Home() {
    const visibility = await getPublicVisibility();
    return (
        <PublicPageWrapper>
            <main className="relative">
                <Hero showAuthButtons={visibility.hero_auth_buttons} />
                <AISection />
            </main>
        </PublicPageWrapper>
    );
}
