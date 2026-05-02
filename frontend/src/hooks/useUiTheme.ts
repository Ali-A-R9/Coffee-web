import { useEffect, useState } from "react";

export type UiTheme = "light" | "dark";

const GLOBAL_THEME_STORAGE_KEY = "cafesite-ui-theme";

function readTheme(value: string | null): UiTheme | null {
  return value === "dark" || value === "light" ? value : null;
}

function getInitialTheme(storageKey: string): UiTheme {
  if (typeof window === "undefined") return "light";

  return (
    readTheme(window.localStorage.getItem(GLOBAL_THEME_STORAGE_KEY)) ||
    readTheme(window.localStorage.getItem(storageKey)) ||
    "light"
  );
}

export function useUiTheme(storageKey: string) {
  const [theme, setTheme] = useState<UiTheme>(() => getInitialTheme(storageKey));

  useEffect(() => {
    window.localStorage.setItem(GLOBAL_THEME_STORAGE_KEY, theme);
    window.localStorage.setItem(storageKey, theme);
  }, [storageKey, theme]);

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}
