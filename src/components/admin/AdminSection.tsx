"use client";

import { motion } from "framer-motion";

interface AdminSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

export function AdminSection({ title, description, children }: AdminSectionProps) {
    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
        >
            <div>
                <h2 className="text-lg font-bold text-fg">{title}</h2>
                {description && <p className="text-sm text-fg/50 mt-1">{description}</p>}
            </div>
            {children}
        </motion.section>
    );
}
