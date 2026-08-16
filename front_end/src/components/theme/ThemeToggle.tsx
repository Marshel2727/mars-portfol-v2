"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  inverse?: boolean;
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" className="theme-svg theme-svg--sun">
      <circle cx="12" cy="12" r="4" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
      <path
        strokeLinecap="round"
        strokeWidth="2"
        d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" className="theme-svg theme-svg--moon">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.2"
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
      />
      <circle cx="19" cy="5" r="1" fill="currentColor" />
      <circle cx="14" cy="2" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function ThemeToggle({ className = "", inverse = false }: ThemeToggleProps) {
  const { isReady, theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const accessibleLabel = `Ganti ke tema ${isDark ? "terang (Light)" : "gelap (Dark)"}`;

  return (
    <button
      type="button"
      className={`theme-toggle-capsule${isDark ? " theme-toggle-capsule--dark" : " theme-toggle-capsule--light"}${
        inverse ? " theme-toggle-capsule--inverse" : ""
      }${className ? ` ${className}` : ""}`}
      onClick={toggleTheme}
      aria-label={accessibleLabel}
      aria-pressed={isDark}
      title={accessibleLabel}
      disabled={!isReady}
      data-ready={isReady}
    >
      {/* Background Track with Dual Icons */}
      <span className="theme-toggle-track" aria-hidden="true">
        <span className={`theme-toggle-slot theme-toggle-slot--sun${!isDark ? " theme-toggle-slot--active" : ""}`}>
          <SunIcon />
        </span>
        <span className={`theme-toggle-slot theme-toggle-slot--moon${isDark ? " theme-toggle-slot--active" : ""}`}>
          <MoonIcon />
        </span>
      </span>

      {/* Sliding Glowing Thumb */}
      <span className="theme-toggle-thumb" aria-hidden="true">
        <span className="theme-toggle-thumb__glow" />
        <span className="theme-toggle-thumb__icon">{isDark ? <MoonIcon /> : <SunIcon />}</span>
      </span>
    </button>
  );
}

export default ThemeToggle;
