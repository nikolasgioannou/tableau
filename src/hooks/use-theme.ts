import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

function resolveSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    const m = stored ?? "system";
    setMode(m);
    applyTheme(m === "system" ? resolveSystemTheme() : m);
  }, []);

  // Listen for OS theme changes when in system mode
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme(resolveSystemTheme());
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setTheme = useCallback((next: ThemeMode) => {
    localStorage.setItem("theme", next);
    setMode(next);
    applyTheme(next === "system" ? resolveSystemTheme() : next);
  }, []);

  return { mode, setTheme };
}
