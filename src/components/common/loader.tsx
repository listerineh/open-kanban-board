'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoaderProps = {
  className?: string;
  text?: string;
};

export function Loader({ className, text }: LoaderProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
            <Loader2 className={cn('animate-spin text-primary h-6 w-6')} />
            {text && <p className="text-muted-foreground">{text}</p>}
        </div>
    );
}


export function FullPageLoader({ className, text = "Loading..." }: LoaderProps) {
  return (
    <div className={cn("flex h-dvh w-full flex-col items-center justify-center gap-4 bg-background text-foreground", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}
