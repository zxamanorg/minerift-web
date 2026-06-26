import React, { useState, useEffect } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function LazyImage({ src, alt, className = "" }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Modern format conversion: if the image comes from standard web sources and we can append parameters, do so.
  // Many CDNs like Unsplash support format=auto&w=500. Let's make a helper to request optimized sizes if possible.
  const getOptimizedUrl = (url: string) => {
    if (!url) return "";
    try {
      if (url.includes("unsplash.com")) {
        const u = new URL(url);
        u.searchParams.set("auto", "format");
        u.searchParams.set("w", "450");
        u.searchParams.set("q", "80");
        return u.toString();
      }
    } catch (e) {
      // Return original if parsing fails
    }
    return url;
  };

  const optimizedSrc = getOptimizedUrl(src);

  useEffect(() => {
    // Fast image preload to detect immediate completion (e.g. from cache)
    const img = new Image();
    img.src = optimizedSrc;
    if (img.complete) {
      setIsLoaded(true);
    }
  }, [optimizedSrc]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-white/[0.02]">
      {/* Blurred Placeholder / Shimmer State */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          <div className="w-10 h-10 rounded-full border border-white/10 border-t-purple-500 animate-spin" />
        </div>
      )}

      {/* Actual Image Layer */}
      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`${className} w-full h-full object-cover transition-opacity duration-300 ease-out will-change-[opacity] ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
