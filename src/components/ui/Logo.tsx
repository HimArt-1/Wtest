"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { width: 36, height: 36 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
};

export function Logo({ className = "", size = "md" }: LogoProps) {
  const dims = sizeMap[size];

  return (
    <Link href="/">
      <motion.div
        className={`relative ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        whileHover={{ scale: 1.05 }}
      >
        <Image
          src="/logo.png"
          alt="وشّى"
          width={dims.width}
          height={dims.height}
          className="object-contain"
          priority
        />
      </motion.div>
    </Link>
  );
}
