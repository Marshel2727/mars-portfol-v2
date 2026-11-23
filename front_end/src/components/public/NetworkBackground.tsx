"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";

import { INTRO_DONE_EVENT } from "@/components/intro/IntroGate";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { Theme } from "@/lib/theme";

import type { NetworkBgController } from "./networkBgScene";

const NETWORK_BG_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  width: "100vw",
  height: "100vh",
  zIndex: -1,
  pointerEvents: "none",
  overflow: "hidden",
  WebkitMaskImage:
    "radial-gradient(ellipse 94% 90% at 50% 48%, #000 62%, transparent 100%)",
  maskImage:
    "radial-gradient(ellipse 94% 90% at 50% 48%, #000 62%, transparent 100%)",
};

export default function NetworkBackground() {
  const { theme, isReady } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<NetworkBgController | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;
    let started = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    let idleHandle: number | undefined;
    let idleTimeout: ReturnType<typeof setTimeout> | undefined;

    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowEndDevice = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 2;
    if (reducedMotion || conn?.saveData || lowEndDevice) {
      return;
    }

    const runImport = () => {
      if (!active) return;
      const initialTheme: Theme =
        document.documentElement.dataset.theme === "dark" ? "dark" : "light";

      void import("./networkBgScene")
        .then(({ createNetworkBgScene }) => {
          if (!active) return;
          const resolvedTheme: Theme =
            document.documentElement.dataset.theme === "dark"
              ? "dark"
              : initialTheme;
          controllerRef.current = createNetworkBgScene(container, resolvedTheme);
        })
        .catch(() => {
          // Silently degrade to plain editorial paper background if WebGL module fails.
        });
    };

    const boot = () => {
      if (!active || started) return;
      started = true;
      window.removeEventListener(INTRO_DONE_EVENT, boot);
      if (fallbackTimer !== undefined) {
        clearTimeout(fallbackTimer);
        fallbackTimer = undefined;
      }

      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(() => runImport(), { timeout: 1200 });
      } else {
        idleTimeout = setTimeout(runImport, 300);
      }
    };

    const introActive =
      document.documentElement.dataset.introActive === "true" ||
      Boolean(document.querySelector(".site-intro"));

    if (introActive) {
      window.addEventListener(INTRO_DONE_EVENT, boot, { once: true });
      fallbackTimer = setTimeout(boot, 5000);
    } else {
      boot();
    }

    return () => {
      active = false;
      window.removeEventListener(INTRO_DONE_EVENT, boot);
      if (fallbackTimer !== undefined) {
        clearTimeout(fallbackTimer);
      }
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (idleTimeout !== undefined) {
        clearTimeout(idleTimeout);
      }
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    controllerRef.current?.setTheme(theme);
  }, [theme, isReady]);

  return (
    <div
      ref={containerRef}
      className="network-bg"
      aria-hidden="true"
      style={NETWORK_BG_STYLE}
    />
  );
}
