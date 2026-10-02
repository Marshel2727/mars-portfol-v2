"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

type Phase = "loading" | "playing" | "closing" | "done";
const privatePath = (path: string) => path === "/login" || path.startsWith("/login/")
  || path === "/admin" || path.startsWith("/admin/");

export default function IntroGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [initialPath] = useState(pathname);
  const [phase, setPhase] = useState<Phase>(privatePath(pathname) ? "done" : "loading");
  const [enabled, setEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const finishRef = useRef<() => void>(() => undefined);
  const visible = phase !== "done" && pathname === initialPath && !privatePath(pathname);
  const skip = useCallback(() => finishRef.current(), []);

  useEffect(() => {
    if (privatePath(initialPath)) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      setPhase("done");
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const controller = new AbortController();
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    let closing = false;
    let dispose: (() => void) | undefined;
    setEnabled(true);
    document.body.style.overflow = "hidden";
    skipRef.current?.focus({ preventScroll: true });

    const restorePage = () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus !== document.body && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
    const dismiss = (fade = true) => {
      if (closing || controller.signal.aborted) return;
      closing = true;
      clearTimeout(loadTimer);
      if (fade) setPhase("closing");
      closeTimer = setTimeout(() => {
        controller.abort();
        dispose?.();
        restorePage();
        setPhase("done");
      }, fade ? 300 : 0);
    };
    finishRef.current = () => dismiss();
    const loadTimer = setTimeout(() => dismiss(false), 3000);
    const keydown = (event: KeyboardEvent) => {
      if (closing || controller.signal.aborted) return;
      if (event.key === "Escape") dismiss();
      if (event.key === "Tab") {
        event.preventDefault();
        skipRef.current?.focus({ preventScroll: true });
      }
    };
    const preferenceChanged = () => {
      if (reducedMotion.matches) dismiss(false);
    };
    const pageHidden = () => dismiss(false);
    document.addEventListener("keydown", keydown);
    reducedMotion.addEventListener("change", preferenceChanged);
    window.addEventListener("pagehide", pageHidden);

    void import("./introScene").then(({ createIntroScene }) => {
      if (controller.signal.aborted || closing) return;
      dispose = createIntroScene(container, controller.signal, {
        onReady: () => {
          if (closing) return;
          clearTimeout(loadTimer);
          setPhase("playing");
        },
        onComplete: () => dismiss(),
        onError: () => dismiss(false),
      });
    }).catch(() => dismiss(false));

    return () => {
      clearTimeout(loadTimer);
      clearTimeout(closeTimer);
      controller.abort();
      dispose?.();
      restorePage();
      document.removeEventListener("keydown", keydown);
      reducedMotion.removeEventListener("change", preferenceChanged);
      window.removeEventListener("pagehide", pageHidden);
      finishRef.current = () => undefined;
    };
  }, [initialPath]);

  useEffect(() => {
    if (pathname !== initialPath) finishRef.current();
  }, [pathname, initialPath]);

  return (
    <>
      <div className="intro-page" inert={visible && enabled ? true : undefined}>
        {children}
      </div>
      {visible && (
        <div className="site-intro" data-phase={phase} role="dialog" aria-modal="true" aria-label="Animasi pembuka Marshel">
          <div className="site-intro__stage" ref={containerRef} />
          <div className="site-intro__poster" aria-hidden="true">
            <Image src="/brand/marshel-logo-v1.png" alt="" width={512} height={512} unoptimized priority />
          </div>
          <p className="site-intro__label">MARSHEL / SOFTWARE × HARDWARE</p>
          <button className="site-intro__skip" ref={skipRef} onClick={skip}>Lewati <span aria-hidden="true">→</span></button>
        </div>
      )}
      <noscript><style>{".site-intro { display: none !important; }"}</style></noscript>
    </>
  );
}
