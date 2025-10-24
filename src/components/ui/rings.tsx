"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface RingsProps {
  size?: number; // Tamaño en px (default: 40 para avatar de 40x40)
  speed?: "slow" | "normal" | "fast";
  className?: string;
}

/**
 * Anillos orbitales animados (extraído de loader.tsx)
 * Diseñado para envolver avatares y elementos pequeños
 */
export function Rings({ size = 40, speed = "normal", className }: RingsProps) {
  // Configurar velocidades de rotación
  const speedConfig = {
    slow: { outer: 5, primary: 4, secondary: 6, accent: 5.5 },
    normal: { outer: 3, primary: 2.5, secondary: 4, accent: 3.5 },
    fast: { outer: 1.5, primary: 1.2, secondary: 2, accent: 1.8 },
  };

  const durations = speedConfig[speed];

  return (
    <motion.div
      className={cn("absolute pointer-events-none", className)}
      style={{
        width: size,
        height: size,
      }}
      animate={{
        scale: [1, 1.02, 1],
      }}
      transition={{
        duration: 4,
        repeat: Number.POSITIVE_INFINITY,
        ease: [0.4, 0, 0.6, 1],
      }}
    >
      {/* Light mode rings (black) */}
      {/* Outer elegant ring with shimmer */}
      <motion.div
        className="absolute inset-0 rounded-full dark:hidden"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, rgb(0, 0, 0) 90deg, transparent 180deg)`,
          mask: `radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)`,
          WebkitMask: `radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)`,
          opacity: 0.8,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: durations.outer,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />

      {/* Primary animated ring with gradient */}
      <motion.div
        className="absolute inset-0 rounded-full dark:hidden"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, rgb(0, 0, 0) 120deg, rgba(0, 0, 0, 0.5) 240deg, transparent 360deg)`,
          mask: `radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)`,
          WebkitMask: `radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)`,
          opacity: 0.9,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: durations.primary,
          repeat: Number.POSITIVE_INFINITY,
          ease: [0.4, 0, 0.6, 1],
        }}
      />

      {/* Secondary elegant ring - counter rotation */}
      <motion.div
        className="absolute inset-0 rounded-full dark:hidden"
        style={{
          background: `conic-gradient(from 180deg, transparent 0deg, rgba(0, 0, 0, 0.6) 45deg, transparent 90deg)`,
          mask: `radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)`,
          WebkitMask: `radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)`,
          opacity: 0.35,
        }}
        animate={{
          rotate: [0, -360],
        }}
        transition={{
          duration: durations.secondary,
          repeat: Number.POSITIVE_INFINITY,
          ease: [0.4, 0, 0.6, 1],
        }}
      />

      {/* Accent particles */}
      <motion.div
        className="absolute inset-0 rounded-full dark:hidden"
        style={{
          background: `conic-gradient(from 270deg, transparent 0deg, rgba(0, 0, 0, 0.4) 20deg, transparent 40deg)`,
          mask: `radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)`,
          WebkitMask: `radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)`,
          opacity: 0.5,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: durations.accent,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />

      {/* Dark mode rings (white) */}
      {/* Outer elegant ring with shimmer */}
      <motion.div
        className="absolute inset-0 rounded-full hidden dark:block"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, rgb(255, 255, 255) 90deg, transparent 180deg)`,
          mask: `radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)`,
          WebkitMask: `radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)`,
          opacity: 0.8,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: durations.outer,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />

      {/* Primary animated ring with gradient */}
      <motion.div
        className="absolute inset-0 rounded-full hidden dark:block"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, rgb(255, 255, 255) 120deg, rgba(255, 255, 255, 0.5) 240deg, transparent 360deg)`,
          mask: `radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)`,
          WebkitMask: `radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)`,
          opacity: 0.9,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: durations.primary,
          repeat: Number.POSITIVE_INFINITY,
          ease: [0.4, 0, 0.6, 1],
        }}
      />

      {/* Secondary elegant ring - counter rotation */}
      <motion.div
        className="absolute inset-0 rounded-full hidden dark:block"
        style={{
          background: `conic-gradient(from 180deg, transparent 0deg, rgba(255, 255, 255, 0.6) 45deg, transparent 90deg)`,
          mask: `radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)`,
          WebkitMask: `radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)`,
          opacity: 0.35,
        }}
        animate={{
          rotate: [0, -360],
        }}
        transition={{
          duration: durations.secondary,
          repeat: Number.POSITIVE_INFINITY,
          ease: [0.4, 0, 0.6, 1],
        }}
      />

      {/* Accent particles */}
      <motion.div
        className="absolute inset-0 rounded-full hidden dark:block"
        style={{
          background: `conic-gradient(from 270deg, transparent 0deg, rgba(255, 255, 255, 0.4) 20deg, transparent 40deg)`,
          mask: `radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)`,
          WebkitMask: `radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)`,
          opacity: 0.5,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: durations.accent,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />
    </motion.div>
  );
}
