"use client";

import Image from 'next/image';
import { useKanbanStore } from '@/hooks/use-kanban-store';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { ProjectManager } from '@/components/kanban/ProjectManager';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const store = useKanbanStore();

  if (!store.isLoaded) {
    return (
      <div className="h-screen w-full flex flex-col bg-background text-foreground">
        <header className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-10 w-48" />
        </header>
        <main className="flex-1 p-6 overflow-x-auto">
          <div className="flex gap-6 h-full">
            <Skeleton className="w-72 sm:w-80 h-full rounded-lg" />
            <Skeleton className="w-72 sm:w-80 h-full rounded-lg" />
            <Skeleton className="w-72 sm:w-80 h-full rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground font-body">
      <header className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-y-3 shrink-0">
        <div className="flex items-center gap-3">
          <Image src="/icon.svg" width={24} height={24} alt="OpenKanban icon" />
          <h1 className="text-xl font-headline font-bold text-gray-200">OpenKanban</h1>
        </div>
        <ProjectManager
          projects={store.projects}
          activeProjectId={store.activeProjectId}
          onSelectProject={store.setActiveProjectId}
          onAddProject={store.addProject}
          onUpdateProjectName={store.updateProjectName}
          onDeleteProject={store.deleteProject}
        />
      </header>
      <main className="flex-1 overflow-auto">
        {store.activeProject ? (
          <KanbanBoard key={store.activeProject.id} project={store.activeProject} store={store} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <h2 className="text-2xl font-headline font-semibold mb-2">Welcome to OpenKanban</h2>
              <p className="text-muted-foreground max-w-md mx-auto">Select a project from the dropdown in the top-right corner, or create a new one to begin organizing your tasks.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
