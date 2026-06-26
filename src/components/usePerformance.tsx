import React, { createContext, useContext, useEffect, useState, useRef } from "react";

interface PerformanceConfig {
  isLowPerformance: boolean;
  isMobile: boolean;
  currentFps: number;
}

const PerformanceContext = createContext<PerformanceConfig>({
  isLowPerformance: false,
  isMobile: false,
  currentFps: 60,
});

export const usePerformance = () => useContext(PerformanceContext);

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentFps, setCurrentFps] = useState(60);

  // Store mutable performance states in refs to avoid re-triggering render cycles during sampling
  const frameTimes = useRef<number[]>([]);
  const lastFrameTime = useRef<number>(0);
  const lowFpsCount = useRef<number>(0);

  useEffect(() => {
    // Initial check for mobile screens or low-power indicators
    const mobileCheck = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
    
    // Proactively enable low-performance mode for mobile to ensure fluid 60 FPS scrolling
    if (mobileCheck) {
      setIsLowPerformance(true);
    }

    let animationFrameId: number;
    let sampleStartTime = performance.now();

    const checkFps = (timestamp: number) => {
      if (lastFrameTime.current > 0) {
        const delta = timestamp - lastFrameTime.current;
        // Keep a rolling buffer of frame times
        frameTimes.current.push(delta);
        if (frameTimes.current.length > 60) {
          frameTimes.current.shift();
        }
      }
      lastFrameTime.current = timestamp;

      // Sample every 1000ms
      if (timestamp - sampleStartTime >= 1000) {
        if (frameTimes.current.length > 10) {
          const totalDuration = frameTimes.current.reduce((a, b) => a + b, 0);
          const avgFrameTime = totalDuration / frameTimes.current.length;
          const calculatedFps = Math.round(1000 / avgFrameTime);
          
          setCurrentFps(calculatedFps);

          // If FPS falls below 55 sustained for multiple periods, auto-downgrade effects
          if (calculatedFps < 55) {
            lowFpsCount.current += 1;
            if (lowFpsCount.current >= 2) {
              setIsLowPerformance(true);
            }
          } else {
            lowFpsCount.current = Math.max(0, lowFpsCount.current - 1);
          }
        }
        sampleStartTime = timestamp;
      }

      animationFrameId = requestAnimationFrame(checkFps);
    };

    animationFrameId = requestAnimationFrame(checkFps);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <PerformanceContext.Provider value={{ isLowPerformance, isMobile, currentFps }}>
      {children}
    </PerformanceContext.Provider>
  );
}
