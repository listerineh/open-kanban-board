'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';
type Accent = 'default' | 'zinc' | 'rose' | 'blue' | 'orange';

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
};

const initialState: ThemeProviderState = {
  theme: 'dark',
  setTheme: () => null,
  accent: 'default',
  setAccent: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [accent, setAccent] = useState<Accent>('default');

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('theme-mode') as Theme | null;
      const storedAccent = localStorage.getItem('theme-accent') as Accent | null;

      if (storedTheme) {
        setTheme(storedTheme);
      }
      if (storedAccent) {
        setAccent(storedAccent);
      }
    } catch (e) {
      console.error('Could not access localStorage', e);
    }
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem('theme-mode', newTheme);
    } catch (e) {
      console.error('Could not access localStorage', e);
    }
    setTheme(newTheme);
  };

  const handleSetAccent = (newAccent: Accent) => {
    try {
      localStorage.setItem('theme-accent', newAccent);
    } catch (e) {
      console.error('Could not access localStorage', e);
    }
    setAccent(newAccent);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    ['theme-zinc', 'theme-rose', 'theme-blue', 'theme-orange'].forEach((t) => root.classList.remove(t));
    if (accent !== 'default') {
      root.classList.add(`theme-${accent}`);
    }

    const primaryColorHsl = getComputedStyle(root).getPropertyValue('--primary').trim();
    if (primaryColorHsl) {
      const primaryColor = `hsl(${primaryColorHsl})`;
      
      const themeColorMeta: HTMLMetaElement | null = document.querySelector("meta[name='theme-color']");
      if(themeColorMeta) {
        themeColorMeta.content = primaryColor;
      }
      const svg = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 20V12" stroke="${primaryColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M15 20V4" stroke="${primaryColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 20V16" stroke="${primaryColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 20V8" stroke="${primaryColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `.trim();

      const faviconUri = `data:image/svg+xml;base64,${btoa(svg)}?v=${Date.now()}`;

      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = faviconUri;
      }

      const appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
      if (appleLink) {
        appleLink.href = faviconUri;
      }
    }
  }, [theme, accent]);

  const value = {
    theme,
    setTheme: handleSetTheme,
    accent,
    setAccent: handleSetAccent,
  };

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  // This is a temporary shim to make the old theme hook work.
  // We're only supporting dark mode for now.
  // The new hook should be used for accent color changes.
  return {
    theme: context.accent,
    setTheme: context.setAccent,
  };
};
