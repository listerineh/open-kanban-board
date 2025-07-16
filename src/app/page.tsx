"use client";

import { useKanbanStore } from '@/hooks/use-kanban-store';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { ProjectManager } from '@/components/kanban/ProjectManager';
import { Skeleton } from '@/components/ui/skeleton';
import { Kanban } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/auth/user-nav';
import { Loader } from '@/components/common/loader';
import { Suspense } from 'react';

function KanbanPageSkeleton() {
  return (
    <div className="h-dvh w-full flex flex-col bg-background text-foreground">
      <header className="px-4 py-3 border-b border-border flex flex-col sm:flex-row flex-wrap items-center justify-between gap-y-3 shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-4">
          <Skeleton className="h-10 w-full sm:w-48" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </header>
      <main className="flex-1 p-4 overflow-x-auto">
        <div className="flex gap-4 h-full">
          <Skeleton className="w-72 sm:w-80 h-full rounded-lg" />
          <Skeleton className="w-72 sm:w-80 h-full rounded-lg hidden md:block" />
          <Skeleton className="w-72 sm:w-80 h-full rounded-lg hidden lg:block" />
        </div>
      </main>
    </div>
  );
}

function HomeContent() {
  const store = useKanbanStore();
  const { user, loading: authLoading } = useAuth();

  if (!store.isLoaded || authLoading) {
    return <KanbanPageSkeleton />;
  }

  return (
    <div className="w-full flex flex-col bg-background text-foreground font-body min-h-0 h-dvh max-h-dvh">
      <header className="px-4 py-3 border-b border-border flex flex-col sm:flex-row flex-wrap items-center justify-between gap-y-3 shrink-0">
        <div className="flex items-center gap-3">
          <Kanban className="text-primary" size={24}/>
          <h1 className="text-xl font-headline font-bold text-gray-200">OpenKanban</h1>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-4">
          <ProjectManager
            projects={store.projects}
            activeProjectId={store.activeProjectId}
            onSelectProject={store.setActiveProjectId}
            onAddProject={store.addProject}
          />
          <UserNav />
        </div>
      </header>
      <main className="flex-1 min-w-0 min-h-0 w-full max-w-full overflow-x-auto flex flex-col h-screen max-h-screen">
        {store.activeProject ? (
          <KanbanBoard key={store.activeProject.id} project={store.activeProject} store={store} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              {user ? (
                <>
                  <h2 className="text-2xl font-headline font-semibold mb-2">Welcome to OpenKanban</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">Select a project from the dropdown or create a new one to begin.</p>
                </>
              ) : (
                  <Loader text="Loading..." />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<KanbanPageSkeleton />}>
      <HomeContent />
    </Suspense>
  )
}