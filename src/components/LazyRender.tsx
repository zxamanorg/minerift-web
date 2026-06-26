import React, { useEffect, useState, useRef } from "react";

interface LazyRenderProps {
  children: React.ReactNode;
  placeholder: React.ReactNode;
  minHeight?: string | number;
}

const LazyRender: React.FC<LazyRenderProps> = ({
  children,
  placeholder,
  minHeight = "450px",
}) => {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Once loaded, keep it loaded to prevent scrolling jitter / unmount-re-mount lag
        }
      },
      {
        rootMargin: "250px", // Pre-render 250px before entering viewport for a flawless transition
        threshold: 0.01,
      }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ minHeight: isInView ? "auto" : minHeight }}
      className="w-full h-full"
    >
      {isInView ? children : placeholder}
    </div>
  );
};

export default LazyRender;

