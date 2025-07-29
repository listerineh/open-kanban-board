'use client';

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';

type Mode = 'light' | 'dark' | 'black';
type Accent = 'default' | 'zinc' | 'rose' | 'blue' | 'orange' | 'violet';

type ThemeProviderState = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  cycleMode: () => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  accentColor: string;
};

const initialState: ThemeProviderState = {
  mode: 'dark',
  setMode: () => null,
  cycleMode: () => null,
  accent: 'default',
  setAccent: () => null,
  accentColor: 'hsl(173 64% 48%)',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const accentColorMap: Record<Accent, string> = {
  default: 'hsl(173 64% 48%)',
  zinc: 'hsl(220 9% 46%)',
  rose: 'hsl(347 89% 61%)',
  blue: 'hsl(221 83% 53%)',
  orange: 'hsl(25 95% 53%)',
  violet: 'hsl(270 60% 50%)',
};

const modeOrder: Mode[] = ['light', 'dark', 'black'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('dark');
  const [accent, setAccent] = useState<Accent>('default');
  const [accentColor, setAccentColor] = useState(accentColorMap.default);

  useEffect(() => {
    try {
      const storedMode = localStorage.getItem('theme-mode') as Mode | null;
      const storedAccent = localStorage.getItem('theme-accent') as Accent | null;

      if (storedMode) {
        setMode(storedMode);
      } else {
        setMode('dark');
      }
      if (storedAccent) {
        setAccent(storedAccent);
        setAccentColor(accentColorMap[storedAccent] || accentColorMap.default);
      } else {
        setAccent('default');
        setAccentColor(accentColorMap.default);
      }
    } catch (e) {
      console.error('Could not access localStorage', e);
    }
  }, []);

  const handleSetMode = (newMode: Mode) => {
    try {
      localStorage.setItem('theme-mode', newMode);
    } catch (e) {
      console.error('Could not access localStorage', e);
    }
    setMode(newMode);
  };

  const handleSetAccent = (newAccent: Accent) => {
    try {
      localStorage.setItem('theme-accent', newAccent);
    } catch (e) {
      console.error('Could not access localStorage', e);
    }
    setAccent(newAccent);
    setAccentColor(accentColorMap[newAccent]);
  };

  const cycleMode = useCallback(() => {
    const currentIndex = modeOrder.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modeOrder.length;
    handleSetMode(modeOrder[nextIndex]);
  }, [mode]);

  useEffect(() => {
    const root = window.document.documentElement;

    // Clear all theme-related classes
    root.classList.remove('light', 'dark', 'theme-black');
    Object.keys(accentColorMap).forEach((key) => {
      root.classList.remove(`theme-${key}`);
    });

    // Apply mode and accent classes
    if (mode === 'light') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
      if (mode === 'black') {
        root.classList.add('theme-black');
      }
    }

    if (accent !== 'default') {
      root.classList.add(`theme-${accent}`);
    } else {
      root.classList.add('theme-default');
    }

    // Update dynamic assets
    const updateDynamicAssets = () => {
      const primaryColor = accentColorMap[accent];
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
        name: 'OpenKanban',
        short_name: 'OpenKanban',
        description: 'A modern, open-source Kanban board to streamline your workflow.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0F172A',
        theme_color: primaryColor,
        icons: [192, 512].map((size) => ({
          src: iconPath,
          sizes: `${size}x${size}`,
          type: 'image/svg+xml',
          purpose: 'any maskable',
        })),
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
  }, [mode, accent]);

  const value = {
    mode,
    setMode: handleSetMode,
    cycleMode,
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
    mode: context.mode,
    setMode: context.setMode,
    cycleMode: context.cycleMode,
    accentColor: context.accentColor,
  };
};
