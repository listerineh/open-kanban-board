import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenKanban',
  description: 'Manage your projects with this free-to-use Kanban Board. Create, edit, and delete projects, as well as add, move, and delete tasks.',
  keywords: ['Kanban', 'Project Management', 'Task Management', 'Free Kanban Board', 'Open Source Kanban'],
  generator: "Next.js",
  referrer: "origin",
  publisher: "Vercel",
  authors: [
    {
      name: 'Listerineh',
      url: 'https://listerineh.dev',
    },
  ],
  openGraph: {
    title: 'OpenKanban Board',
    description: 'Manage your projects with this free-to-use Kanban Board. Create, edit, and delete projects, as well as add, move, and delete tasks.',
    url: '',
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
    description: 'Manage your projects with this free-to-use Kanban Board. Create, edit, and delete projects, as well as add, move, and delete tasks.',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
      </head>
      <body className="font-body antialiased">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
