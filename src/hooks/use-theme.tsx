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

    const updateDynamicAssets = async () => {
      const primaryColorHsl = getComputedStyle(root).getPropertyValue('--primary').trim();
      if (!primaryColorHsl) return;

      const primaryColor = `hsl(${primaryColorHsl})`;

      const themeColorMeta: HTMLMetaElement | null = document.querySelector("meta[name='theme-color']");
      if (themeColorMeta) {
        themeColorMeta.content = primaryColor;
      }

      const svgTemplate = (size: number) =>
        `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="${primaryColor}"/>
          <path d="M9 20V12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M15 20V4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 20V16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 20V8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `.trim();

      const faviconUri = `data:image/svg+xml;base64,${btoa(svgTemplate(512))}?v=${Date.now()}`;
      let faviconLink: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (faviconLink) {
        faviconLink.href = faviconUri;
      }

      // Generate PNG icons for manifest and apple-touch-icon
      const iconSizes = [48, 72, 96, 128, 144, 192, 512];
      const iconPromises = iconSizes.map((size) => {
        return new Promise((resolve) => {
          const img = new Image();
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          img.onload = () => {
            if (ctx) {
              ctx.drawImage(img, 0, 0, size, size);
              resolve({
                src: canvas.toDataURL('image/png'),
                sizes: `${size}x${size}`,
                type: 'image/png',
              });
            } else {
              resolve(null);
            }
          };
          img.src = `data:image/svg+xml;base64,${btoa(svgTemplate(size))}`;
        });
      });

      const manifestIcons = (await Promise.all(iconPromises)).filter(Boolean);

      const manifest = {
        name: 'OpenKanban',
        short_name: 'OpenKanban',
        description: 'A modern, open-source Kanban board to streamline your workflow.',
        start_url: '/',
        display: 'standalone',
        background_color: '#18181b',
        theme_color: primaryColor,
        icons: manifestIcons,
      };

      const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      let manifestLink: HTMLLinkElement | null = document.querySelector("link[rel='manifest']");
      if (manifestLink) {
        manifestLink.href = manifestUrl;
      }

      const appleTouchIcon = manifestIcons.find((icon) => icon && (icon as any).sizes === '192x192');
      if (appleTouchIcon) {
        let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
        if (appleLink) {
          appleLink.href = (appleTouchIcon as any).src;
        }
      }
    };

    setTimeout(updateDynamicAssets, 100);
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
  return {
    theme: context.accent,
    setTheme: context.setAccent,
  };
};
