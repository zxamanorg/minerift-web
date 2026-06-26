import React from "react";
import { motion } from "motion/react";

interface GlowButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  glowColor?: "purple" | "cyan" | "rose";
  fullWidth?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}

export default function GlowButton({
  children,
  variant = "primary",
  glowColor = "purple",
  fullWidth = false,
  onClick,
  type = "button",
  disabled = false,
  className = ""
}: GlowButtonProps) {
  const getColors = () => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white border-purple-500/30 hover:brightness-110 active:brightness-95";
      case "secondary":
        return "bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white border-cyan-500/30 hover:brightness-110 active:brightness-95";
      case "danger":
        return "bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-500/30 hover:brightness-110 active:brightness-95";
      case "ghost":
        return "bg-white/5 hover:bg-white/15 text-slate-200 border-white/10";
    }
  };

  const getGlow = () => {
    if (variant === "ghost") return "";
    switch (glowColor) {
      case "purple":
        return "shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.65)]";
      case "cyan":
        return "shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.65)]";
      case "rose":
        return "shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:shadow-[0_0_25px_rgba(244,63,94,0.65)]";
    }
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 rounded-lg font-medium text-sm border transition-all duration-300 backdrop-blur-md flex items-center justify-center gap-2 ${getColors()} ${getGlow()} ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {children}
    </motion.button>
  );
}
