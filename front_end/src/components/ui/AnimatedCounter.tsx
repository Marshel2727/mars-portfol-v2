"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: string | number;
  duration?: number; // ms
  className?: string;
  autoProjectCount?: number;
}

export function AnimatedCounter({
  value,
  duration = 1400,
  className = "",
  autoProjectCount,
}: AnimatedCounterProps) {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const [displayValue, setDisplayValue] = useState<string>("0");
  const hasAnimatedRef = useRef(false);

  // Normalize string/number
  const rawString = String(value ?? "");
  const effectiveValue =
    rawString === "AUTO_PROJECT_COUNT"
      ? String(autoProjectCount ?? 0).padStart(2, "0")
      : rawString;

  // Extract number and suffix/prefix (e.g. "03" -> num: 3, pad: 2; "100%" -> num: 100, suffix: "%")
  const match = effectiveValue.match(/^([^0-9]*)(\d+)(.*)$/);
  const prefix = match ? match[1] : "";
  const targetNumber = match ? parseInt(match[2], 10) : null;
  const suffix = match ? match[3] : "";
  const isPadded = match && match[2].startsWith("0") && match[2].length > 1;
  const padLength = match ? match[2].length : 0;

  useEffect(() => {
    if (targetNumber === null) {
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;

          const startTime = performance.now();

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out expo curve
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const currentNum = Math.floor(easeProgress * targetNumber);

            let formattedNum = String(currentNum);
            if (isPadded) {
              formattedNum = formattedNum.padStart(padLength, "0");
            }

            setDisplayValue(`${prefix}${formattedNum}${suffix}`);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              let finalNum = String(targetNumber);
              if (isPadded) finalNum = finalNum.padStart(padLength, "0");
              setDisplayValue(`${prefix}${finalNum}${suffix}`);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [targetNumber, prefix, suffix, isPadded, padLength, duration]);

  return (
    <span ref={containerRef} className={`animated-counter ${className}`}>
      {targetNumber === null ? effectiveValue : displayValue}
    </span>
  );
}

export default AnimatedCounter;
