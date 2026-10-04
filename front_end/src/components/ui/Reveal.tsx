"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";

type RevealProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article";
  children: ReactNode;
};

/**
 * Fade/slide-in saat elemen masuk viewport.
 * Konten tetap terlihat tanpa JS, saat reduced-motion, atau jika sudah ada di layar saat load.
 */
export default function Reveal({ as = "div", children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    el.dataset.reveal = "hidden";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = "shown";
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as as "div";
  return (
    <Tag {...rest} ref={ref as React.RefObject<HTMLDivElement>}>
      {children}
    </Tag>
  );
}
