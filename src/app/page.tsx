'use client';

import { useState, useEffect } from 'react';
import { useKanbanStore } from '@/hooks/use-kanban-store';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/auth/user-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardSkeleton } from '@/components/common/skeletons';
import { Badge } from '@/components/ui/badge';
import { useNewProjectDialog } from '@/hooks/use-new-project-dialog';
import { Notifications } from '@/components/notifications/Notifications';
import { AppIcon } from '@/components/common/AppIcon';
import { STORAGE_KEYS } from '@/lib/constants';

export default function RootPage() {
  const { projects, isLoaded } = useKanbanStore();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const { openDialog } = useNewProjectDialog();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (isLoaded) {
      try {
        const lastProjectId = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_PROJECT);
        if (lastProjectId && projects.some((p) => p.id === lastProjectId)) {
          router.replace(`/p/${lastProjectId}`);
        } else {
          setIsRedirecting(false);
        }
      } catch (error) {
        console.error('Failed to access localStorage', error);
        setIsRedirecting(false);
      }
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [isLoaded, user, authLoading, projects, router]);

  const handleHomeClick = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVE_PROJECT);
      setIsRedirecting(false);
    } catch (error) {
      console.error('Failed to remove from localStorage', error);
    }
  };

  if (authLoading || !isLoaded || isRedirecting) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="w-screen h-dvh flex flex-col bg-background text-foreground font-body overflow-x-hidden">
      <header className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="relative">
          <Link href="/" className="flex items-center gap-3" onClick={handleHomeClick}>
            <AppIcon className="h-6 w-6" />
            <h1 className="text-xl font-headline font-bold">OpenKanban</h1>
          </Link>
          <Badge
            variant="secondary"
            className="absolute -right-8 -bottom-2 text-[10px] scale-90 px-1.5 py-0.5 pointer-events-none"
          >
            alpha
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Notifications />
          <UserNav />
        </div>
      </header>
      <main className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center mt-32 sm:mt-0">
            <h2 className="text-3xl font-headline font-bold">Welcome, {user?.displayName ?? 'User'}!</h2>
            <p className="text-muted-foreground mt-2">
              Select a project to continue or create a new one to get started.
            </p>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="md:hover:border-primary md:hover:shadow-lg transition-all cursor-pointer flex flex-col"
                  onClick={() => router.push(`/p/${project.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="truncate">{project.name}</CardTitle>
                    <CardDescription>
                      {project.columns.length} columns,{' '}
                      {project.columns.reduce((acc, col) => acc + col.tasks.length, 0)} tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-end">
                    <span className="text-xs text-muted-foreground">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              ))}
              <Card
                className="border-dashed border-2 md:hover:border-primary md:hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center text-muted-foreground md:hover:text-primary"
                onClick={openDialog}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
                  <PlusCircle className="h-8 w-8" />
                  <span className="font-semibold">Create New Project</span>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-headline font-semibold mb-2">No projects yet!</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                It looks like you don't have any projects. Create your first one to start organizing your tasks.
              </p>
              <Button onClick={openDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create your first project
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
