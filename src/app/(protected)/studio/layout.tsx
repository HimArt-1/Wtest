import { Sidebar } from "@/components/studio/layout/Sidebar";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-bg" dir="rtl">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
