import { Hero } from "@/components/sections/Hero";
import { AISection } from "@/components/sections/AISection";
import { getPublicVisibility } from "@/app/actions/settings";

export default async function Home() {
    const visibility = await getPublicVisibility();
    return (
        <main className="relative">
            <Hero showAuthButtons={visibility.hero_auth_buttons} />
            <AISection />
        </main>
    );
}
