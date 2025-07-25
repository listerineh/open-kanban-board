"use client";

import { useParams, useRouter } from "next/navigation";
import { useKanbanStore } from "@/hooks/use-kanban-store";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ListTodo,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Project, KanbanUser, Task } from "@/types/kanban";
import { FullPageLoader } from "@/components/common/loader";
import { useAuth } from "@/hooks/use-auth";
import { UserNav } from "@/components/auth/user-nav";
import { StatCard } from "@/components/dashboard/StatCard";
import { TaskStatusChart } from "@/components/dashboard/TaskStatusChart";
import { isPast, parseISO } from "date-fns";
import { TasksPerMemberChart } from "@/components/dashboard/TasksPerMemberChart";
import { TasksByPriorityChart } from "@/components/dashboard/TasksByPriorityChart";

export default function ProjectDashboardPage() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };
  const store = useKanbanStore();
  const { loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<KanbanUser[]>([]);

  useEffect(() => {
    if (authLoading || !store.isLoaded) return;

    const foundProject = store.projects.find((p) => p.id === projectId);

    if (foundProject) {
      setProject(foundProject);
      store.getProjectMembers(projectId).then(setMembers);
    } else {
      router.replace("/");
    }
  }, [projectId, store.projects, store.isLoaded, authLoading, router, store]);

  const allTasks = useMemo(
    () => project?.columns.flatMap((c) => c.tasks) ?? [],
    [project],
  );

  const hasTasksWithDeadline = useMemo(
    () => allTasks.some((t) => !!t.deadline),
    [allTasks],
  );

  const stats = useMemo(() => {
    if (!project) return null;

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.completedAt).length;
    const overdueTasks = allTasks.filter(
      (t) => !t.completedAt && t.deadline && isPast(parseISO(t.deadline)),
    ).length;

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      membersCount: members.length,
    };
  }, [project, allTasks, members]);

  if (authLoading || !store.isLoaded || !project || !stats) {
    return <FullPageLoader text="Loading dashboard..." />;
  }

  return (
    <div className="h-dvh bg-background text-foreground overflow-y-auto">
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/p/${projectId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-headline">Dashboard</h1>
              <p className="text-muted-foreground">
                Analytics for "{project.name}"
              </p>
            </div>
          </div>
          <UserNav />
        </header>

        <main className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Tasks"
              value={stats.totalTasks}
              icon={<ListTodo className="h-5 w-5 text-muted-foreground" />}
            />
            <StatCard
              title="Completed Tasks"
              value={stats.completedTasks}
              icon={<CheckCircle className="h-5 w-5 text-muted-foreground" />}
            />
            {hasTasksWithDeadline && (
              <StatCard
                title="Overdue Tasks"
                value={stats.overdueTasks}
                icon={<Clock className="h-5 w-5 text-muted-foreground" />}
              />
            )}
            <StatCard
              title="Active Members"
              value={stats.membersCount}
              icon={<Users className="h-5 w-5 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <TaskStatusChart project={project} />
            <TasksByPriorityChart tasks={allTasks} />
          </div>

          <div>
            <TasksPerMemberChart tasks={allTasks} members={members} />
          </div>
        </main>
      </div>
    </div>
  );
}
