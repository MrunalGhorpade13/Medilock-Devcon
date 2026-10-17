import { useState, useEffect } from "react";

export function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("medilock-dark");
    if (stored) return stored === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    localStorage.setItem("medilock-dark", String(isDark));
  }, [isDark]);

  return [isDark, () => setIsDark((d) => !d)];
}
