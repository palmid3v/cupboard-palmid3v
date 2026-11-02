import { useContext } from "react";
import { ThemeContext } from "./theme-context.js";

export function useThemeEngine() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useThemeEngine must be used within a ThemeProvider.");
  return context;
}
