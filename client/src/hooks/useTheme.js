import { useCallback, useEffect, useState } from "react";

// Distinct from the old "theme"/"theme_dark" keys used by the removed toggle
// buttons, so every user starts fresh on "system" (Device) under this key.
const STORAGE_KEY = "themeMode"; // "light" | "dark" | "system"

const prefersDarkQuery = () =>
  window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

const getSystemPrefersDark = () => {
  const mq = prefersDarkQuery();
  return mq ? mq.matches : false;
};

const getStoredMode = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light" || stored === "system") return stored;
  return "system"; // no explicit choice yet -> follow the OS/browser
};

const resolveIsDark = (mode) => (mode === "system" ? getSystemPrefersDark() : mode === "dark");

const applyTheme = (isDark) => {
  document.documentElement.classList.toggle("dark", isDark);
};

// Shared theme state: "system" (default) follows the OS/browser color-scheme
// preference live; "light"/"dark" is an explicit user choice that overrides it.
export function useTheme() {
  const [themeMode, setThemeModeState] = useState(getStoredMode);
  const [isDarkMode, setIsDarkModeState] = useState(() => resolveIsDark(getStoredMode()));

  useEffect(() => {
    applyTheme(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const mq = prefersDarkQuery();
    if (!mq) return;
    const handleChange = (e) => {
      if (themeMode === "system") setIsDarkModeState(e.matches);
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [themeMode]);

  const setThemeMode = useCallback((mode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setThemeModeState(mode);
    setIsDarkModeState(resolveIsDark(mode));
  }, []);

  return { isDarkMode, themeMode, setThemeMode };
}
