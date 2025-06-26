"use client";

import { useParams, useRouter } from 'next/navigation';
import { useKanbanStore } from '@/hooks/use-kanban-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Project, Column } from '@/types/kanban';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ProjectConfigPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { projects, updateProjectName, updateColumnTitle, deleteColumn, isLoaded , deleteProject } = useKanbanStore();
  
  const [project, setProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [columns, setColumns] = useState<Column[]>([]);
  const [columnToDelete, setColumnToDelete] = useState<Column | null>(null);
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      const foundProject = projects.find(p => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
        setProjectName(foundProject.name);
        setColumns(foundProject.columns);
      } else {
        router.push('/');
      }
    }
  }, [projectId, projects, isLoaded, router]);

  const handleProjectNameSave = () => {
    if (project && projectName.trim()) {
      updateProjectName(project.id, projectName.trim());
    }
  };

  const handleColumnTitleChange = (columnId: string, newTitle: string) => {
    setColumns(currentColumns => 
      currentColumns.map(c => c.id === columnId ? { ...c, title: newTitle } : c)
    );
  };

  const handleColumnTitleBlur = (columnId: string, title: string) => {
    const originalColumn = project?.columns.find(c => c.id === columnId);
    if (title.trim() && title.trim() !== originalColumn?.title) {
        updateColumnTitle(columnId, title.trim());
    } else if (originalColumn) {
        setColumns(current => current.map(c => c.id === columnId ? originalColumn : c));
    }
  };

  const handleDeleteColumn = (column: Column) => {
    if (column.tasks.length > 0) return;
    setColumnToDelete(column);
  };

  const confirmDeleteColumn = () => {
    if (columnToDelete) {
      deleteColumn(columnToDelete.id);
      setColumnToDelete(null);
    }
  }

  const handleConfirmDeleteProject = () => {
    if (project) {
        deleteProject(project.id);
        router.push('/');
    }
    setIsDeleteProjectDialogOpen(false);
  };

  if (!isLoaded || !project) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p>Loading project settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
              <h1 className="text-2xl font-bold font-headline">Project Settings</h1>
              <p className="text-muted-foreground">Manage your project details and columns.</p>
          </div>
        </header>
        
        <main className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Project Name</CardTitle>
              <CardDescription>Change the name of your project. This will be visible across the application.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="max-w-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleProjectNameSave()}
                />
                <Button onClick={handleProjectNameSave} className="w-full sm:w-auto">Save Name</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Columns</CardTitle>
              <CardDescription>Rename or delete columns for this project's board.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {columns.map(column => (
                <div key={column.id} className="flex items-center gap-2 p-2 rounded-md border bg-card/50">
                  <Input
                    value={column.title}
                    onChange={(e) => handleColumnTitleChange(column.id, e.target.value)}
                    onBlur={(e) => handleColumnTitleBlur(column.id, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="flex-grow bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteColumn(column)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                This action is permanent and cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setIsDeleteProjectDialogOpen(true)}>
                <Trash2 className="h-4 w-4" /> Delete this project
              </Button>
            </CardContent>
          </Card>
        </main>

        <AlertDialog open={!!columnToDelete} onOpenChange={(isOpen) => !isOpen && setColumnToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the "{columnToDelete?.title}" column. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setColumnToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteColumn} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isDeleteProjectDialogOpen} onOpenChange={setIsDeleteProjectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the <strong>{project?.name}</strong> project, including all of its columns and tasks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteProject} className="bg-destructive hover:bg-destructive/90">
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
