"use client";

import { useState, useEffect, useCallback } from "react";
import { useKanbanStore } from "@/hooks/use-kanban-store";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ProjectManager } from "@/components/kanban/ProjectManager";
import { UserNav } from "@/components/auth/user-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Kanban, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/common/skeletons";
import { Badge } from "@/components/ui/badge";

export default function RootPage() {
  const store = useKanbanStore();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (store.isLoaded && user) {
      try {
        const lastProjectId = localStorage.getItem("lastActiveProjectId");
        if (
          lastProjectId &&
          store.projects.some((p) => p.id === lastProjectId)
        ) {
          router.replace(`/p/${lastProjectId}`);
          // Still set isRedirecting to false in case redirect fails for some reason
        } else {
          setIsRedirecting(false);
        }
      } catch (error) {
        console.error("Failed to access localStorage", error);
        setIsRedirecting(false);
      }
    }
  }, [store.isLoaded, user, store.projects, router]);

  useEffect(() => {
    if (!store.isLoaded) {
      setIsRedirecting(true);
    }
  }, [store.isLoaded]);

  const handleProjectSubmit = async () => {
    if (newProjectName.trim() && !isSubmitting) {
      setIsSubmitting(true);
      const newProjectId = await store.addProject(newProjectName.trim());
      setIsSubmitting(false);
      setNewProjectName("");
      setIsNewProjectDialogOpen(false);
      if (newProjectId) {
        router.push(`/p/${newProjectId}`);
      }
    }
  };

  const handleHomeClick = () => {
    try {
      localStorage.removeItem("lastActiveProjectId");
      setIsRedirecting(false);
    } catch (error) {
      console.error("Failed to remove from localStorage", error);
    }
  };

  if (authLoading || !store.isLoaded || isRedirecting) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="w-screen h-dvh flex flex-col bg-background text-foreground font-body overflow-x-hidden">
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
          <ProjectManager projects={store.projects} activeProjectId={null} />
          <UserNav />
        </div>
      </header>
      <main className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center mt-10 sm:mt-0">
            <h2 className="text-3xl font-headline font-bold">
              Welcome, {user?.displayName ?? "User"}!
            </h2>
            <p className="text-muted-foreground mt-2">
              Select a project to continue or create a new one to get started.
            </p>
          </div>

          {store.projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {store.projects.map((project) => (
                <Card
                  key={project.id}
                  className="hover:border-primary hover:shadow-lg transition-all cursor-pointer flex flex-col"
                  onClick={() => router.push(`/p/${project.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="truncate">{project.name}</CardTitle>
                    <CardDescription>
                      {project.columns.length} columns,{" "}
                      {project.columns.reduce(
                        (acc, col) => acc + col.tasks.length,
                        0,
                      )}{" "}
                      tasks
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
                className="border-dashed border-2 hover:border-primary hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center text-muted-foreground hover:text-primary"
                onClick={() => setIsNewProjectDialogOpen(true)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
                  <PlusCircle className="h-8 w-8" />
                  <span className="font-semibold">Create New Project</span>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-headline font-semibold mb-2">
                No projects yet!
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                It looks like you don't have any projects. Create your first one
                to start organizing your tasks.
              </p>
              <Button onClick={() => setIsNewProjectDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create your first project
              </Button>
            </div>
          )}
        </div>
      </main>
      <Dialog
        open={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Website Redesign"
                onKeyDown={(e) => e.key === "Enter" && handleProjectSubmit()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleProjectSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
