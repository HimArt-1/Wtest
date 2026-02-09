import { Sidebar } from "@/components/studio/layout/Sidebar";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-sand/30">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
