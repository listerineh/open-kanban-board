"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="w-screen h-dvh flex flex-col bg-background text-foreground font-body overflow-x-hidden">
      <header className="px-4 py-3 border-b border-border flex flex-col sm:flex-row flex-wrap items-center justify-between gap-y-3 shrink-0">
        <div className="relative">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="absolute -right-8 -bottom-2 h-4 w-12" />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-4">
          <Skeleton className="h-10 w-full sm:w-48" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>
      <main className="flex-1 w-full flex flex-col items-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-4xl sm:mt-44 -mt-10">
          <div className="mb-8 text-center mt-32 sm:mt-0">
            <Skeleton className="h-9 w-64 mx-auto" />
            <Skeleton className="h-5 w-96 mx-auto mt-3" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="flex-grow flex items-end">
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed border-2 flex flex-col items-center justify-center">
              <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export function KanbanBoardSkeleton() {
  return (
    <div className="w-full flex flex-col bg-background text-foreground font-body min-h-0 h-dvh max-h-dvh">
      <header className="px-4 py-3 border-b border-border flex flex-col sm:flex-row flex-wrap items-center justify-between gap-y-3 shrink-0">
        <div className="relative">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="absolute -right-8 -bottom-2 h-4 w-12" />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-4">
          <Skeleton className="h-10 w-full sm:w-48" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>
      <main className="flex-1 min-w-0 min-h-0 w-full max-w-full overflow-x-auto flex flex-col sm:flex-row h-screen max-h-screen">
        <div className="w-full sm:flex-1 sm:w-auto p-2 sm:p-4 md:p-6 flex flex-col sm:flex-row gap-4 overflow-x-auto max-w-screen min-w-0 min-h-0 h-full max-h-screen">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-full sm:w-72 md:w-80 max-w-full min-w-0 min-h-[200px] h-auto flex flex-col rounded-lg bg-card/50 transition-all sm:h-full sm:max-h-screen sm:flex-grow space-y-3"
            >
              <div className="p-3 border-b border-border flex justify-between items-center gap-2">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-5 w-8" />
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="p-3 mt-auto">
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          ))}
          <div className="flex-shrink-0 w-full sm:w-72 md:w-80 max-w-full min-w-0 min-h-[100px] h-auto flex flex-col rounded-lg bg-card/50 transition-all sm:h-full sm:max-h-screen sm:flex-grow">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
