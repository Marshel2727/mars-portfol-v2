"use client";

import { useEffect, useRef } from "react";

import { useTheme } from "@/components/theme/ThemeProvider";
import type { Theme } from "@/lib/theme";

import type { NetworkBgController } from "./networkBgScene";

export default function NetworkBackground() {
  const { theme, isReady } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<NetworkBgController | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;
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

    return () => {
      active = false;
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    controllerRef.current?.setTheme(theme);
  }, [theme, isReady]);

  return <div ref={containerRef} className="network-bg" aria-hidden="true" />;
}
