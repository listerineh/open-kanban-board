"use client";

import { useKanbanStore } from "@/hooks/use-kanban-store";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { ProjectManager } from "@/components/kanban/ProjectManager";
import { Kanban } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserNav } from "@/components/auth/user-nav";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Project } from "@/types/kanban";
import { KanbanBoardSkeleton } from "@/components/common/skeletons";
import { Badge } from "@/components/ui/badge";

function ProjectPageContent() {
  const store = useKanbanStore();
  const { user, loading: authLoading } = useAuth();
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!user || authLoading || !store.isLoaded) {
      // Data is not ready yet, so we wait.
      return;
    }

    const foundProject = store.projects.find((p) => p.id === projectId);

    if (foundProject) {
      setProject(foundProject);
      try {
        localStorage.setItem("lastActiveProjectId", projectId);
      } catch (error) {
        console.error("Failed to write to localStorage", error);
      }
    } else {
      // All data is loaded, but the project is not found. Redirect.
      try {
        localStorage.removeItem("lastActiveProjectId");
      } catch (error) {
        console.error("Failed to remove from localStorage", error);
      }
      router.replace("/");
    }
  }, [projectId, user, authLoading, store.isLoaded, store.projects, router]);

  const handleHomeClick = () => {
    try {
      localStorage.removeItem("lastActiveProjectId");
    } catch (error) {
      console.error("Failed to remove from localStorage", error);
    }
  };

  if (authLoading || !store.isLoaded || !project) {
    return <KanbanBoardSkeleton />;
  }

  return (
    <div className="w-full flex flex-col bg-background text-foreground font-body min-h-0 h-dvh max-h-dvh">
      <header className="px-4 py-3 border-b border-border flex flex-col sm:flex-row flex-wrap items-center justify-between gap-y-3 shrink-0">
        <div className="relative">
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={handleHomeClick}
          >
            <Kanban className="text-primary" size={24} />
            <h1 className="text-xl font-headline font-bold text-gray-200">
              OpenKanban
            </h1>
          </Link>
          <Badge
            variant="secondary"
            className="absolute -right-8 -bottom-2 text-[10px] scale-90 px-1.5 py-0.5 pointer-events-none"
          >
            alpha
          </Badge>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-4">
          <ProjectManager
            projects={store.projects}
            activeProjectId={projectId}
          />
          <UserNav />
        </div>
      </header>
      <main className="flex-1 min-w-0 min-h-0 w-full max-w-full overflow-x-auto flex flex-col h-screen max-h-screen">
        <KanbanBoard key={project.id} project={project} store={store} />
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
