import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { defaultThemeId, isValidThemeId, themes } from './themes.js';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'palmi-theme-engine:v1';
const modes = new Set(['dark', 'light', 'system']);

function readSettings(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw && isValidThemeId(raw)) return { themeId: raw, mode: 'dark', accent: '' };
    const saved = JSON.parse(raw || '{}');
    return {
      themeId: isValidThemeId(saved.themeId) ? saved.themeId : defaultThemeId,
      mode: modes.has(saved.mode) ? saved.mode : 'dark',
      accent: typeof saved.accent === 'string' && /^#[0-9a-f]{6}$/i.test(saved.accent) ? saved.accent : '',
    };
  } catch {
    return { themeId: defaultThemeId, mode: 'dark', accent: '' };
  }
}

export function ThemeProvider({ children, storageKey = STORAGE_KEY, defaultTheme = defaultThemeId }) {
  const [systemMode, setSystemMode] = useState(() => (
    window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  ));
  const [settings, setSettings] = useState(() => {
    const saved = readSettings(storageKey);
    return { ...saved, themeId: isValidThemeId(saved.themeId) ? saved.themeId : (isValidThemeId(defaultTheme) ? defaultTheme : defaultThemeId) };
  });
  const theme = useMemo(() => themes.find((item) => item.id === settings.themeId) ?? themes[0], [settings.themeId]);
  const setTheme = useCallback((themeId) => { if (isValidThemeId(themeId)) setSettings((current) => ({ ...current, themeId })); }, []);
  const setMode = useCallback((mode) => { if (modes.has(mode)) setSettings((current) => ({ ...current, mode })); }, []);
  const setAccent = useCallback((accent) => {
    if (typeof accent === 'string' && /^#[0-9a-f]{6}$/i.test(accent)) setSettings((current) => ({ ...current, accent }));
  }, []);
  const resetTheme = useCallback(() => {
    setSettings({ themeId: isValidThemeId(defaultTheme) ? defaultTheme : defaultThemeId, mode: 'dark', accent: '' });
  }, [defaultTheme]);

  useEffect(() => {
    const root = document.documentElement;
    const resolvedMode = settings.mode === 'system' ? systemMode : settings.mode;
    const lightTokens = { background: '#f4f6fa', surface: '#ffffff', text: '#172033', muted: '#596579', border: '#d9dfeb' };
    root.dataset.theme = theme.id;
    root.dataset.colorMode = resolvedMode;
    Object.entries(theme.colors).forEach(([key, value]) => {
      const resolvedValue = resolvedMode === 'light' && key in lightTokens ? lightTokens[key] : value;
      root.style.setProperty('--theme-' + key, key === 'primary' && settings.accent ? settings.accent : resolvedValue);
    });
    root.style.setProperty('--theme-gradient', theme.gradient);
    root.style.setProperty('--theme-accent-override', settings.accent || theme.colors.primary);
    root.style.colorScheme = resolvedMode;
    const cup = {
      background: resolvedMode === 'light' ? lightTokens.background : theme.colors.background,
      surface: resolvedMode === 'light' ? lightTokens.surface : theme.colors.surface,
      text: resolvedMode === 'light' ? lightTokens.text : theme.colors.text,
      muted: resolvedMode === 'light' ? lightTokens.muted : theme.colors.muted,
      border: resolvedMode === 'light' ? lightTokens.border : theme.colors.border,
      primary: settings.accent || theme.colors.primary,
      secondary: theme.colors.secondary,
      accent: theme.colors.accent,
    };
    const cupboardTokens = {
      '--cupboard-bg': cup.background,
      '--cupboard-surface': cup.surface,
      '--cupboard-surface-muted': cup.secondary,
      '--cupboard-surface-raised': cup.border,
      '--cupboard-text': cup.text,
      '--cupboard-text-muted': cup.muted,
      '--cupboard-text-subtle': cup.muted,
      '--cupboard-primary': cup.primary,
      '--cupboard-primary-hover': cup.accent,
      '--cupboard-primary-soft': cup.secondary,
      '--cupboard-accent': cup.accent,
      '--cupboard-accent-soft': cup.secondary,
      '--cupboard-border': cup.border,
      '--cupboard-success': cup.primary,
      '--cupboard-info': cup.secondary,
    };
    Object.entries(cupboardTokens).forEach(([name, value]) => root.style.setProperty(name, value));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', cup.background);
    try { window.localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* Current-session preferences still work. */ }
  }, [settings, storageKey, theme, systemMode]);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: light)');
    if (!media) return undefined;
    const update = (event) => setSystemMode(event.matches ? 'light' : 'dark');
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  const value = useMemo(() => ({
    theme, themeId: settings.themeId, mode: settings.mode, accent: settings.accent, themes,
    setTheme, setMode, setAccent, resetTheme,
  }), [theme, settings, setTheme, setMode, setAccent, resetTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeEngine() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeEngine must be used within a ThemeProvider.');
  return context;
}
