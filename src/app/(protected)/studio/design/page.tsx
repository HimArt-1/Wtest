"use client";

import { useSearchParams } from "next/navigation";
import { ToolsPanel } from "@/components/studio/design/ToolsPanel";
import { ApparelPreview } from "@/components/studio/design/ApparelPreview";
import { useState } from "react";

import { Suspense } from "react";

function DesignPageContent() {
    const searchParams = useSearchParams();
    const [apparelType, setApparelType] = useState<"tshirt" | "hoodie">("tshirt");
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6">
            {/* Tools Panel (Left Sidebar) */}
            <div className="w-full lg:w-[400px] bg-white rounded-2xl border border-ink/5 flex flex-col overflow-hidden shadow-sm">
                <ToolsPanel
                    setGeneratedImage={setGeneratedImage}
                    apparelType={apparelType}
                    setApparelType={setApparelType}
                />
            </div>

            {/* Preview Canvas (Center/Right) */}
            <div className="flex-1 bg-white rounded-2xl border border-ink/5 flex items-center justify-center p-8 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-ink/5 [mask-image:linear-gradient(0deg,white,transparent)]" />
                <ApparelPreview
                    type={apparelType}
                    designImage={generatedImage}
                />
            </div>
        </div>
    );
}

export default function DesignPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
            <DesignPageContent />
        </Suspense>
    );
}
