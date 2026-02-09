"use client";

import { motion } from "framer-motion";

interface ApparelPreviewProps {
    type: "tshirt" | "hoodie";
    designImage: string | null;
}

export function ApparelPreview({ type, designImage }: ApparelPreviewProps) {
    return (
        <div className="relative w-full max-w-2xl aspect-[4/5] flex items-center justify-center">
            <motion.div
                layout
                className="relative w-full h-full flex items-center justify-center drop-shadow-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Apparel Base Image - Using Mock Colors for now to represent generic mockups */}
                <div
                    className={`relative w-[80%] h-[80%] ${type === "tshirt"
                            ? "bg-[#EAEAEA] rounded-[3rem_3rem_0_0] after:content-[''] after:absolute after:top-0 after:left-1/2 after:-translate-x-1/2 after:w-32 after:h-8 after:bg-black/5 after:rounded-b-full" // Very rough CSS t-shirt shape
                            : "bg-[#D4D4D4] rounded-[4rem_4rem_2rem_2rem]" // Very rough CSS hoodie shape
                        } shadow-inner flex items-center justify-center overflow-hidden`}
                >
                    {/* In a real app, I'd use an actual image here like: */}
                    {/* <img src={type === "tshirt" ? "/mockups/tshirt.png" : "/mockups/hoodie.png"} className="w-full h-full object-contain" /> */}

                    <div className="absolute inset-0 flex items-center justify-center text-fg/10 font-bold text-6xl uppercase tracking-widest pointer-events-none select-none">
                        {type === "tshirt" ? "T-Shirt" : "Hoodie"}
                    </div>

                    {/* Design Overlay */}
                    {designImage && (
                        <motion.div
                            className="absolute w-[40%] aspect-square top-[25%] left-1/2 -translate-x-1/2 mix-blend-multiply"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                        >
                            <img
                                src={designImage}
                                alt="Design"
                                className="w-full h-full object-contain"
                            />
                        </motion.div>
                    )}

                    {/* Texture Overlay */}
                    <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none mix-blend-overlay" />
                </div>
            </motion.div>

            {/* Environment/Shadows */}
            <div className="absolute bottom-10 w-[60%] h-8 bg-black/20 blur-2xl rounded-full" />
        </div>
    );
}
