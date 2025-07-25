import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/hooks/use-auth';
import './globals.css';
import { NewProjectDialogProvider } from '@/hooks/use-new-project-dialog';
import { ThemeProvider } from '@/hooks/use-theme';

export const metadata: Metadata = {
  title: 'OpenKanban',
  description:
    'Manage your projects with this free-to-use Kanban Board. Create, edit, and delete projects, as well as add, move, and delete tasks.',
  keywords: ['Kanban', 'Project Management', 'Task Management', 'Free Kanban Board', 'Open Source Kanban'],
  generator: 'Next.js',
  referrer: 'origin',
  manifest: '/manifest.json',
  publisher: 'Vercel',
  authors: [
    {
      name: 'Listerineh',
      url: 'https://listerineh.dev',
    },
  ],
  openGraph: {
    title: 'OpenKanban Board',
    description:
      'Manage your projects with this free-to-use Kanban Board. Create, edit, and delete projects, as well as add, move, and delete tasks.',
    url: 'https://open-kanban.vercel.app',
    siteName: 'OpenKanban Board',
    images: [
      {
        url: '/images/website_screenshot.webp',
        width: 1200,
        height: 630,
        alt: 'OpenKanban Board Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    title: 'OpenKanban Board',
    description:
      'Manage your projects with this free-to-use Kanban Board. Create, edit, and delete projects, as well as add, move, and delete tasks.',
    images: [
      {
        url: '/images/website_screenshot.webp',
        width: 1200,
        height: 630,
        alt: 'OpenKanban Board Preview',
      },
    ],
    card: 'summary_large_image',
  },
};

const defaultIconSvg = `
<svg width="512" height="512" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="4" fill="transparent"/>
  <path d="M9 20V12" stroke="hsl(173 64% 48%)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M15 20V4" stroke="hsl(173 64% 48%)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M3 20V16" stroke="hsl(173 64% 48%)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M21 20V8" stroke="hsl(173 64% 48%)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`.trim();
const defaultIconUri = `data:image/svg+xml;base64,${btoa(defaultIconSvg)}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link id="favicon" rel="icon" href={defaultIconUri} type="image/svg+xml" />
        <link id="apple-touch-icon" rel="apple-touch-icon" href={defaultIconUri} />
        <link rel="manifest" href="data:application/json;base64,e30=" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider>
          <AuthProvider>
            <NewProjectDialogProvider>
              <TooltipProvider>{children}</TooltipProvider>
              <Toaster />
            </NewProjectDialogProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
