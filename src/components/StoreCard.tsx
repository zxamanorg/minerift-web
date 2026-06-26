import React from "react";
import { Product } from "../types";
import { Shield, Key, Coins, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import GlowButton from "./GlowButton";
import LazyImage from "./LazyImage";
import { usePerformance } from "./usePerformance";

interface StoreCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const StoreCard: React.FC<StoreCardProps> = React.memo(({ product, onAddToCart }) => {
  const { isLowPerformance, isMobile } = usePerformance();

  const getCategoryTheme = () => {
    switch (product.category) {
      case "ranks":
        return {
          badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
          borderHover: "group-hover:border-purple-500/30",
          shadowHover: isMobile ? "" : "hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]",
          icon: <Shield className="w-4 h-4 text-purple-400" />,
          btnColor: "purple" as const,
        };
      case "keys":
        return {
          badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
          borderHover: "group-hover:border-cyan-500/30",
          shadowHover: isMobile ? "" : "hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]",
          icon: <Key className="w-4 h-4 text-cyan-400" />,
          btnColor: "cyan" as const,
        };
      case "coins":
        return {
          badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          borderHover: "group-hover:border-amber-500/30",
          shadowHover: isMobile ? "" : "hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]",
          icon: <Coins className="w-4 h-4 text-amber-400" />,
          btnColor: "cyan" as const,
        };
    }
  };

  const theme = getCategoryTheme();

  // If performance mode is downgraded (e.g. mobile or lag detected),
  // we render a simplified HTML container with lightweight hardware-accelerated CSS classes
  // rather than heavy framer-motion listeners.
  if (isLowPerformance) {
    return (
      <div
        className={`group relative rounded-2xl border border-white/5 bg-slate-950/80 p-5 flex flex-col justify-between transition-transform duration-300 ease-out will-change-transform active:scale-[0.98] ${theme.borderHover} ${theme.shadowHover}`}
      >
        {/* Simplified Layout: No heavy absolute glow blur layers */}
        
        {/* Image Container */}
        <div className="relative w-full h-44 rounded-xl overflow-hidden mb-4 bg-slate-900 border border-white/5">
          <LazyImage src={product.imageUrl} alt={product.name} />
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/80 border border-white/10">
            {theme.icon}
            <span>{product.category}</span>
          </div>
        </div>

        {/* Header Info */}
        <div className="flex-1 flex flex-col mb-4">
          <h3 className="text-base font-bold text-slate-100 tracking-wide mb-1">
            {product.name}
          </h3>
          <p className="text-slate-400 text-xs leading-normal font-sans">
            {product.description}
          </p>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider">Price</span>
            <span className="text-lg font-black text-slate-100">
              ₹{product.price}
            </span>
          </div>

          <GlowButton
            variant={product.category === "ranks" ? "primary" : "secondary"}
            glowColor={theme.btnColor}
            onClick={() => onAddToCart(product)}
            className="!py-1.5 !px-3.5 !text-xs font-semibold"
          >
            <ShoppingCart className="w-3 h-3" />
            Add to Cart
          </GlowButton>
        </div>
      </div>
    );
  }

  // Full-fidelity desktop version with high-refresh rate animations
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "100px" }}
      whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2, ease: "easeOut" } }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ willChange: "transform, opacity" }}
      className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-md p-5 flex flex-col justify-between transition-colors duration-300 hover:bg-slate-950/80 ${theme.borderHover} ${theme.shadowHover}`}
    >
      {/* Light glow on desktop hover only */}
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full pointer-events-none" />

      {/* Image Container */}
      <div className="relative w-full h-44 rounded-xl overflow-hidden mb-4 bg-slate-900 border border-white/5">
        <LazyImage
          src={product.imageUrl}
          alt={product.name}
          className="group-hover:scale-[1.03] transition-transform duration-300 ease-out"
        />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border backdrop-blur-md bg-black/40 border-white/10">
          {theme.icon}
          <span>{product.category}</span>
        </div>
      </div>

      {/* Header Info */}
      <div className="flex-1 flex flex-col mb-4">
        <h3 className="text-base font-bold text-slate-100 tracking-wide mb-1 flex items-center gap-2">
          {product.name}
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed flex-1 font-sans">
          {product.description}
        </p>
      </div>

      {/* Pricing & Add to Cart */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Price</span>
          <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400">
            ₹{product.price}
          </span>
        </div>

        <GlowButton
          variant={product.category === "ranks" ? "primary" : "secondary"}
          glowColor={theme.btnColor}
          onClick={() => onAddToCart(product)}
          className="!py-2 !px-4 !text-xs font-semibold"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Add to Cart
        </GlowButton>
      </div>
    </motion.div>
  );
});

StoreCard.displayName = "StoreCard";

export const StoreCardSkeleton: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/40 p-5 flex flex-col justify-between h-[450px]">
      <div>
        <div className="relative w-full h-44 rounded-xl bg-slate-900 mb-4 overflow-hidden border border-white/5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>
        <div className="h-5 w-2/3 bg-slate-900 rounded mb-3" />
        <div className="h-3 w-full bg-slate-900 rounded mb-1.5" />
        <div className="h-3 w-5/6 bg-slate-900 rounded" />
      </div>
      <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-6">
        <div className="flex flex-col gap-1">
          <div className="h-2 w-8 bg-slate-900 rounded" />
          <div className="h-5 w-16 bg-slate-900 rounded" />
        </div>
        <div className="h-8 w-28 bg-slate-900 rounded-lg" />
      </div>
    </div>
  );
};

export default StoreCard;
