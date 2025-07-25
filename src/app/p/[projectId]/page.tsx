'use client';

import { useKanbanStore } from '@/hooks/use-kanban-store';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Search, X, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/auth/user-nav';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Project } from '@/types/kanban';
import { KanbanBoardSkeleton } from '@/components/common/skeletons';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Notifications } from '@/components/notifications/Notifications';

function ProjectPageContent() {
  const store = useKanbanStore();
  const { loading: authLoading } = useAuth();
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authLoading || !store.isLoaded) {
      // Data is not ready yet, so we wait.
      return;
    }

    const foundProject = store.projects.find((p) => p.id === projectId);

    if (foundProject) {
      setProject(foundProject);
      try {
        localStorage.setItem('lastActiveProjectId', projectId);
      } catch (error) {
        console.error('Failed to write to localStorage', error);
      }
    } else {
      // All data is loaded, but the project is not found. Redirect.
      try {
        localStorage.removeItem('lastActiveProjectId');
      } catch (error) {
        console.error('Failed to remove from localStorage', error);
      }
      router.replace('/');
    }
  }, [projectId, authLoading, store.isLoaded, store.projects, router]);

  const handleHomeClick = () => {
    try {
      localStorage.removeItem('lastActiveProjectId');
    } catch (error) {
      console.error('Failed to remove from localStorage', error);
    }
  };

  if (authLoading || !store.isLoaded || !project) {
    return <KanbanBoardSkeleton />;
  }

  const filteredProject = {
    ...project,
    columns: project.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    })),
  };

  const enableDashboard = project.enableDashboard ?? true;

  return (
    <div className="w-full flex flex-col bg-background text-foreground font-body min-h-0 h-dvh max-h-dvh">
      <header className="px-4 py-3 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        {/* Desktop Layout */}
        <div className="hidden md:flex flex-1 items-center justify-start">
          <div className="relative">
            <Link href="/" className="flex items-center gap-3" onClick={handleHomeClick}>
              <Image src="/icon.svg" width={24} height={24} alt="OpenKanban icon" />
              <h1 className="text-xl font-headline font-bold">OpenKanban</h1>
            </Link>
            <Badge
              variant="secondary"
              className="absolute -right-8 -bottom-2 text-[10px] scale-90 px-1.5 py-0.5 pointer-events-none"
            >
              alpha
            </Badge>
          </div>
        </div>

        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search in ${project.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-1 items-center justify-end gap-2">
          {enableDashboard && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/p/${project.id}/dashboard`} passHref>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <LayoutDashboard className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Dashboard</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/p/${project.id}/config`} passHref>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Project Settings</p>
            </TooltipContent>
          </Tooltip>
          <Notifications />
          <UserNav />
        </div>

        {/* Mobile Layout */}
        <div className="w-full flex flex-col items-center gap-4 md:hidden">
          <div className="relative text-center">
            <Link href="/" className="inline-flex items-center justify-center gap-3" onClick={handleHomeClick}>
              <Image src="/icon.svg" width={24} height={24} alt="OpenKanban icon" />
              <h1 className="text-xl font-headline font-bold">OpenKanban</h1>
            </Link>
            <Badge
              variant="secondary"
              className="absolute -right-4 -bottom-2 text-[10px] scale-90 px-1.5 py-0.5 pointer-events-none"
            >
              alpha
            </Badge>
          </div>

          <div className="w-full flex items-center justify-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search in ${project.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {enableDashboard && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/p/${project.id}/dashboard`} passHref>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <LayoutDashboard className="h-5 w-5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dashboard</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/p/${project.id}/config`} passHref>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Project Settings</p>
                </TooltipContent>
              </Tooltip>
              <Notifications />
              <UserNav />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 min-w-0 min-h-0 w-full max-w-full overflow-x-auto flex flex-col h-screen max-h-screen">
        <KanbanBoard key={project.id} project={filteredProject} store={store} />
      </main>
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<KanbanBoardSkeleton />}>
      <ProjectPageContent />
    </Suspense>
  );
}
