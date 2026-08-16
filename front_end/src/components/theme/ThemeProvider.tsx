"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { THEME_COLORS, THEME_STORAGE_KEY, Theme } from "@/lib/theme";

interface ThemeContextValue {
  isReady: boolean;
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark";

const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const getStoredTheme = (): Theme | null => {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(storedTheme) ? storedTheme : null;
  } catch {
    return null;
  }
};

const syncThemeColor = (theme: Theme) => {
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = THEME_COLORS[theme];
  });
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isReady, setIsReady] = useState(false);
  const transitionTimer = useRef<number | null>(null);

  const applyTheme = useCallback((nextTheme: Theme, animate = false) => {
    const root = document.documentElement;

    if (transitionTimer.current !== null) {
      window.clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }

    if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.dataset.themeTransition = "true";
      transitionTimer.current = window.setTimeout(() => {
        delete root.dataset.themeTransition;
        transitionTimer.current = null;
      }, 200);
    } else {
      delete root.dataset.themeTransition;
    }

    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;
    syncThemeColor(nextTheme);
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    const rootTheme = document.documentElement.dataset.theme ?? null;
    const initialTheme = isTheme(rootTheme)
      ? rootTheme
      : getStoredTheme() ?? getSystemTheme();

    const readyFrame = window.requestAnimationFrame(() => {
      applyTheme(initialTheme);
      setIsReady(true);
    });

    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (getStoredTheme() === null) applyTheme(getSystemTheme());
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      applyTheme(isTheme(event.newValue) ? event.newValue : getSystemTheme());
    };

    systemPreference.addEventListener("change", handleSystemChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.cancelAnimationFrame(readyFrame);
      systemPreference.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorage);
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    };
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The visual theme still changes when storage is unavailable.
    }

    applyTheme(nextTheme, true);
  }, [applyTheme, theme]);

  const value = useMemo(
    () => ({ isReady, theme, toggleTheme }),
    [isReady, theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
