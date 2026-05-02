import { useEffect, useState } from "react";

export type UiTheme = "light" | "dark";

function getInitialTheme(storageKey: string): UiTheme {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(storageKey) === "dark" ? "dark" : "light";
}

export function useUiTheme(storageKey: string) {
  const [theme, setTheme] = useState<UiTheme>(() => getInitialTheme(storageKey));

  useEffect(() => {
    window.localStorage.setItem(storageKey, theme);
  }, [storageKey, theme]);

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}
