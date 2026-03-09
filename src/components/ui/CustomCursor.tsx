"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
    const [cursorVariant, setCursorVariant] = useState("default");
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 700 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            mouseX.set(e.clientX - 16);
            mouseY.set(e.clientY - 16);
        };

        const handleHoverStart = () => setCursorVariant("hover");
        const handleHoverEnd = () => setCursorVariant("default");

        window.addEventListener("mousemove", moveCursor);

        // Add event listeners for hoverable elements
        const hoverables = document.querySelectorAll("a, button, input, textarea, .hover-trigger");
        hoverables.forEach((el) => {
            el.addEventListener("mouseenter", handleHoverStart);
            el.addEventListener("mouseleave", handleHoverEnd);
        });

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            hoverables.forEach((el) => {
                el.removeEventListener("mouseenter", handleHoverStart);
                el.removeEventListener("mouseleave", handleHoverEnd);
            });
        };
    }, [mouseX, mouseY]);

    // Re-attach listeners when DOM updates (simple implementation)
    useEffect(() => {
        const handleHoverStart = () => setCursorVariant("hover");
        const handleHoverEnd = () => setCursorVariant("default");

        const observer = new MutationObserver(() => {
            const hoverables = document.querySelectorAll("a, button, input, textarea, .hover-trigger");
            hoverables.forEach((el) => {
                el.removeEventListener("mouseenter", handleHoverStart); // Prevent duplicates
                el.removeEventListener("mouseleave", handleHoverEnd);
                el.addEventListener("mouseenter", handleHoverStart);
                el.addEventListener("mouseleave", handleHoverEnd);
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    const variants = {
        default: {
            width: 32,
            height: 32,
            backgroundColor: "color-mix(in srgb, var(--wusha-gold) 20%, transparent)",
            border: "1px solid color-mix(in srgb, var(--wusha-gold) 50%, transparent)",
        },
        hover: {
            width: 64,
            height: 64,
            backgroundColor: "color-mix(in srgb, var(--wusha-gold) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--wusha-gold) 80%, transparent)",
            mixBlendMode: "difference" as any,
        },
    };

    return (
        <motion.div
            className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full hidden md:block"
            style={{
                x: cursorX,
                y: cursorY,
            }}
            variants={variants}
            animate={cursorVariant}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
        >
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-1 bg-wusha-gold rounded-full" />
            </div>
        </motion.div>
    );
}
