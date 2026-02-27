import { Hero } from "@/components/sections/Hero";
import { JoinSection } from "@/components/sections/JoinSection";
import { AISection } from "@/components/sections/AISection";

export default function Home() {
    return (
        <main className="relative">
            <Hero />
            <AISection />
            <JoinSection />
        </main>
    );
}
