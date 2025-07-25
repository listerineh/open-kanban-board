'use client';

import { Search, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] dark:bg-background dark:bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>
      </div>
      <Card className="w-full max-w-md text-center z-10 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tight">404</CardTitle>
          <CardDescription className="mt-2 text-lg">Oops! The page you are looking for does not exist.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-muted-foreground">You might have mistyped the address or the page may have moved.</p>
          <Link href="/" passHref>
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Go back to safety
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
