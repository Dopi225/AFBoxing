import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'afboxing_theme';

export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.removeAttribute('data-theme');
    root.style.colorScheme = 'light';
  }
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved === 'dark';
      }
    } catch {
      /* ignore */
    }
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    applyTheme(dark ? 'dark' : 'light');
    try {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [dark]);

  const toggleTheme = useCallback(() => {
    setDark((d) => !d);
  }, []);

  const value = useMemo(
    () => ({ dark, setDark, toggleTheme }),
    [dark, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return ctx;
}
