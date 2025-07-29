'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { THEME_ACCENT_COLORS, STORAGE_KEYS, APP_METADATA } from '@/lib/constants';

type Theme = 'dark' | 'light';
type Accent = 'default' | 'zinc' | 'rose' | 'blue' | 'orange' | 'violet';

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  accentColor: string;
};

const initialState: ThemeProviderState = {
  theme: 'dark',
  setTheme: () => null,
  accent: 'default',
  setAccent: () => null,
  accentColor: THEME_ACCENT_COLORS.default,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [accent, setAccent] = useState<Accent>('default');
  const [accentColor, setAccentColor] = useState<string>(THEME_ACCENT_COLORS.default);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME_MODE) as Theme | null;
      const storedAccent = localStorage.getItem(STORAGE_KEYS.THEME_ACCENT) as Accent | null;

      if (storedTheme) {
        setTheme(storedTheme);
      }
      if (storedAccent) {
        setAccent(storedAccent);
        setAccentColor(THEME_ACCENT_COLORS[storedAccent]);
      }
    } catch (e) {
      console.error('Could not access localStorage', e);
    }
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, newTheme);
    } catch (e) {
      console.error('Could not access localStorage', e);
    }
    setTheme(newTheme);
  };

  const handleSetAccent = (newAccent: Accent) => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME_ACCENT, newAccent);
    } catch (e) {
      console.error('Could not access localStorage', e);
    }
    setAccent(newAccent);
    setAccentColor(THEME_ACCENT_COLORS[newAccent]);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    ['theme-zinc', 'theme-rose', 'theme-blue', 'theme-orange', 'theme-violet'].forEach((t) => root.classList.remove(t));
    if (accent !== 'default') {
      root.classList.add(`theme-${accent}`);
    }

    const updateDynamicAssets = () => {
      const primaryColor = THEME_ACCENT_COLORS[accent];
      const iconPath = `/icons/${accent}.svg`;

      const themeColorMeta: HTMLMetaElement | null = document.querySelector("meta[name='theme-color']");
      if (themeColorMeta) {
        themeColorMeta.content = primaryColor;
      }

      let faviconLink: HTMLLinkElement | null = document.querySelector("link[id='favicon']");
      if (faviconLink) {
        faviconLink.href = iconPath;
      }

      let appleLink: HTMLLinkElement | null = document.querySelector("link[id='apple-touch-icon']");
      if (appleLink) {
        appleLink.href = iconPath;
      }

      const manifest = {
        name: APP_METADATA.NAME,
        short_name: APP_METADATA.SHORT_NAME,
        description: APP_METADATA.DESCRIPTION,
        start_url: APP_METADATA.START_URL,
        display: APP_METADATA.DISPLAY,
        background_color: APP_METADATA.BACKGROUND_COLOR,
        theme_color: primaryColor,
        icons: [
          {
            src: iconPath,
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      };

      let manifestLink: HTMLLinkElement | null = document.querySelector("link[id='manifest']");
      if (manifestLink) {
        try {
            const oldManifestUrl = manifestLink.href;
            if (oldManifestUrl.startsWith('blob:')) {
                URL.revokeObjectURL(oldManifestUrl);
            }
        } catch (e) {
            console.error('Error revoking object URL', e);
        }
        const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const manifestUrl = URL.createObjectURL(manifestBlob);
        manifestLink.href = manifestUrl;
      }
    };

    requestAnimationFrame(updateDynamicAssets);
  }, [theme, accent]);

  const value = {
    theme,
    setTheme: handleSetTheme,
    accent,
    setAccent: handleSetAccent,
    accentColor,
  };

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return {
    theme: context.accent,
    setTheme: context.setAccent,
    accentColor: context.accentColor,
  };
};
