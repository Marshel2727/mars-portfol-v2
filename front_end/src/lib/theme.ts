export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "marshel-theme";

export const THEME_COLORS: Record<Theme, string> = {
  light: "#F3F0E8",
  dark: "#101614",
};

export const THEME_INIT_SCRIPT = `(() => {
  const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
  const colors = ${JSON.stringify(THEME_COLORS)};
  let savedTheme = null;

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue === "light" || storedValue === "dark") savedTheme = storedValue;
  } catch {}

  const theme = savedTheme || (
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", colors[theme]);
  });
})();`;
