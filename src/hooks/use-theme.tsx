
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

const accentColorMap: Record<Accent, string> = {
    default: 'hsl(173 64% 48%)',
    zinc: 'hsl(220 9% 46%)',
    rose: 'hsl(347 89% 61%)',
    blue: 'hsl(221 83% 53%)',
    orange: 'hsl(25 95% 53%)',
};

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
        console.error("Could not access localStorage", e);
    }
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    try {
        localStorage.setItem('theme-mode', newTheme);
    } catch (e) {
        console.error("Could not access localStorage", e);
    }
    setTheme(newTheme);
  };
  
  const handleSetAccent = (newAccent: Accent) => {
    try {
        localStorage.setItem('theme-accent', newAccent);
    } catch (e) {
        console.error("Could not access localStorage", e);
    }
    setAccent(newAccent);
  }

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    ['theme-zinc', 'theme-rose', 'theme-blue', 'theme-orange'].forEach(t => root.classList.remove(t));
    if (accent !== 'default') {
        root.classList.add(`theme-${accent}`);
    }
    
    const updateDynamicAssets = () => {
      const primaryColor = accentColorMap[accent];
      const iconPath = `/icons/${accent}.svg`;

      const themeColorMeta: HTMLMetaElement | null = document.querySelector("meta[name='theme-color']");
      if(themeColorMeta) {
        themeColorMeta.content = primaryColor;
      }
      
      let faviconLink: HTMLLinkElement | null = document.querySelector("link[id='favicon']");
      if(faviconLink) {
        faviconLink.href = iconPath;
      }
      
      let appleLink: HTMLLinkElement | null = document.querySelector("link[id='apple-touch-icon']");
      if(appleLink) {
          appleLink.href = iconPath;
      }

      const manifest = {
        name: "OpenKanban",
        short_name: "OpenKanban",
        description: "A modern, open-source Kanban board to streamline your workflow.",
        start_url: "/",
        display: "standalone",
        background_color: "#0F172A",
        theme_color: primaryColor,
        icons: [192, 512].map(size => ({
          src: iconPath,
          sizes: `${size}x${size}`,
          type: "image/svg+xml",
          purpose: "any maskable"
        }))
      };

      const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      let manifestLink: HTMLLinkElement | null = document.querySelector("link[id='manifest']");
      if (manifestLink) {
        manifestLink.href = manifestUrl;
      }
    };
    
    requestAnimationFrame(updateDynamicAssets);

  }, [theme, accent]);

  const value = {
    theme,
    setTheme: handleSetTheme,
    accent,
    setAccent: handleSetAccent
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return {
    theme: context.accent,
    setTheme: context.setAccent
  };
};
