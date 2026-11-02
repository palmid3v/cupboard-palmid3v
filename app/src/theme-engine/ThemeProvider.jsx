import { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultThemeId, isValidThemeId, themes } from './themes.js';
import { ThemeContext } from './theme-context.js';

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
  const resolvedMode = settings.mode === 'system' ? systemMode : settings.mode;
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
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedMode === 'light' ? lightTokens.background : theme.colors.background);
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
    theme, themeId: settings.themeId, mode: settings.mode, resolvedMode, accent: settings.accent, themes,
    setTheme, setMode, setAccent, resetTheme,
  }), [theme, settings, resolvedMode, setTheme, setMode, setAccent, resetTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

