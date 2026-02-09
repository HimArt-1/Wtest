import { Hero } from "@/components/sections/Hero";
import { Gallery } from "@/components/sections/Gallery";
import { Store } from "@/components/sections/Store";
import { JoinSection } from "@/components/sections/JoinSection";
import { AISection } from "@/components/sections/AISection";

export default function Home() {
    return (
        <main>
            <Hero />
            <Gallery />
            <AISection />
            <Store />
            <JoinSection />
        </main>
    );
}
