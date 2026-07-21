import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'washco-theme';
const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#eaf4fe',
  dark: '#08121e',
};

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(theme: Theme): ResolvedTheme {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

/** Applies the resolved theme to <html> and updates the theme-color meta tag. */
function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[resolved]);
}

function readStoredTheme(): Theme {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  /** Cycles Light → Dark → System. */
  cycleTheme: () => void;
  /** Wires up the OS-preference listener; call once at app start. */
  initTheme: () => void;
}

const initialTheme = readStoredTheme();

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  resolvedTheme: resolve(initialTheme),

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
    const resolved = resolve(theme);
    applyTheme(resolved);
    set({ theme, resolvedTheme: resolved });
  },

  cycleTheme: () => {
    const order: Theme[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(get().theme) + 1) % order.length];
    get().setTheme(next);
  },

  initTheme: () => {
    // Keep in sync when the OS theme changes and we're following 'system'.
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (get().theme === 'system') {
        const resolved = systemPrefersDark() ? 'dark' : 'light';
        applyTheme(resolved);
        set({ resolvedTheme: resolved });
      }
    };
    mql.addEventListener('change', onChange);
    // Ensure the class matches the store on mount (the inline script already ran).
    applyTheme(get().resolvedTheme);
  },
}));
