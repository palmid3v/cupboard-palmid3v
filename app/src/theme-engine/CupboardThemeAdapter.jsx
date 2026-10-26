import { useEffect } from "react";
import { useThemeEngine } from "./index.js";

export default function CupboardThemeAdapter({ children }) {
  const { theme, resolvedMode, accent } = useThemeEngine();

  useEffect(() => {
    const root = document.documentElement;
    const light = {
      background: "#f4f6fa",
      surface: "#ffffff",
      text: "#172033",
      muted: "#596579",
      border: "#d9dfeb",
    };
    const colors = {
      background: resolvedMode === "light" ? light.background : theme.colors.background,
      surface: resolvedMode === "light" ? light.surface : theme.colors.surface,
      text: resolvedMode === "light" ? light.text : theme.colors.text,
      muted: resolvedMode === "light" ? light.muted : theme.colors.muted,
      border: resolvedMode === "light" ? light.border : theme.colors.border,
      primary: accent || theme.colors.primary,
      secondary: theme.colors.secondary,
      accent: theme.colors.accent,
    };
    const tokens = {
      "--cupboard-bg": colors.background,
      "--cupboard-surface": colors.surface,
      "--cupboard-surface-muted": colors.secondary,
      "--cupboard-surface-raised": colors.border,
      "--cupboard-text": colors.text,
      "--cupboard-text-muted": colors.muted,
      "--cupboard-text-subtle": colors.muted,
      "--cupboard-primary": colors.primary,
      "--cupboard-primary-hover": colors.accent,
      "--cupboard-primary-soft": colors.secondary,
      "--cupboard-accent": colors.accent,
      "--cupboard-accent-soft": colors.secondary,
      "--cupboard-border": colors.border,
      "--cupboard-success": colors.primary,
      "--cupboard-info": colors.secondary,
    };
    root.style.colorScheme = resolvedMode;
    Object.entries(tokens).forEach(([name, value]) => root.style.setProperty(name, value));
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", colors.background);
  }, [theme, resolvedMode, accent]);

  return children;
}
