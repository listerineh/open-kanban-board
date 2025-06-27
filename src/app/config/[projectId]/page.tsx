"use client";

import { useParams, useRouter } from 'next/navigation';
import { useKanbanStore } from '@/hooks/use-kanban-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Project, Column, KanbanUser } from '@/types/kanban';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FullPageLoader } from '@/components/common/loader';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/auth/user-nav';

export default function ProjectConfigPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const store = useKanbanStore();
  const { toast } = useToast();
  const { user: currentUser, loading: authLoading } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [columns, setColumns] = useState<Column[]>([]);
  const [members, setMembers] = useState<KanbanUser[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  
  const [columnToDelete, setColumnToDelete] = useState<Column | null>(null);
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);

  useEffect(() => {
    if (store.isLoaded) {
      const foundProject = store.projects.find(p => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
        setProjectName(projectName || foundProject.name);
        setColumns(foundProject.columns);
        store.getProjectMembers(projectId).then(setMembers);
      } else if (!authLoading) {
        router.push('/');
      }
    }
  }, [projectId, store.projects, store.isLoaded, router, authLoading, store]);

  const handleProjectNameSave = async () => {
    if (project && projectName.trim()) {
      await store.updateProjectName(project.id, projectName.trim());
    }
  };

  const handleColumnTitleChange = (columnId: string, newTitle: string) => {
    setColumns(currentColumns => 
      currentColumns.map(c => c.id === columnId ? { ...c, title: newTitle } : c)
    );
  };

  const handleColumnTitleBlur = async (columnId: string, title: string) => {
    const originalColumn = project?.columns.find(c => c.id === columnId);
    if (title.trim() && title.trim() !== originalColumn?.title) {
        await store.updateColumnTitle(columnId, title.trim());
    } else if (originalColumn) {
        setColumns(current => current.map(c => c.id === columnId ? originalColumn : c));
    }
  };

  const handleDeleteColumn = (column: Column) => {
    if (column.tasks.length > 0) {
      toast({
        variant: "destructive",
        title: "Cannot delete column",
        description: "Please move or delete all tasks from this column first.",
      });
      return;
    }
    setColumnToDelete(column);
  };

  const confirmDeleteColumn = async () => {
    if (columnToDelete) {
      await store.deleteColumn(columnToDelete.id);
      setColumnToDelete(null);
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (project) {
        await store.deleteProject(project.id);
        router.push('/');
    }
    setIsDeleteProjectDialogOpen(false);
  };
  
  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !project) return;
    const { success, message } = await store.inviteUserToProject(project.id, inviteEmail);
    toast({ title: success ? "Success" : "Error", description: message, variant: success ? "default" : "destructive" });
    if(success) {
        setInviteEmail('');
        store.getProjectMembers(projectId).then(setMembers);
    }
  }

  const handleRemoveUser = async (userId: string) => {
      if(!project) return;
      await store.removeUserFromProject(project.id, userId);
      toast({ title: "Success", description: "User removed from project." });
      store.getProjectMembers(projectId).then(setMembers);
  }

  const isOwner = project && currentUser && project.ownerId === currentUser.uid;

  if (authLoading || !store.isLoaded || !project) {
    return <FullPageLoader text="Loading project settings..." />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <header className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push(`/?projectId=${projectId}`)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Project Settings</h1>
                    <p className="text-muted-foreground">Manage your project details and members.</p>
                </div>
            </div>
            <UserNav />
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
                  disabled={!isOwner}
                />
                <Button onClick={handleProjectNameSave} className="w-full sm:w-auto" disabled={!isOwner}>Save Name</Button>
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
                    disabled={!isOwner}
                  />
                  {isOwner && (
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteColumn(column)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Manage Members</CardTitle>
              <CardDescription>Invite or remove members from this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isOwner && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <Input
                        type="email"
                        placeholder="user@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="max-w-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleInviteUser()}
                        />
                        <Button onClick={handleInviteUser} className="w-full sm:w-auto">Invite User</Button>
                    </div>
                )}
                <div className="space-y-2">
                    {members.map(member => (
                        <div key={member.uid} className="flex items-center justify-between p-2 rounded-md border">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.photoURL ?? ''} alt={member.displayName ?? 'User'} />
                                    <AvatarFallback>{member.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{member.displayName}</p>
                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                            </div>
                            {project.ownerId === member.uid ? (
                                <span className="text-xs text-muted-foreground font-semibold">OWNER</span>
                            ) : isOwner && (
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveUser(member.uid)}>
                                    <X className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>

          {isOwner && (
            <Card className="border-destructive">
                <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                    This action is permanent and cannot be undone.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <Button variant="destructive" onClick={() => setIsDeleteProjectDialogOpen(true)}>
                    <Trash2 className="h-4 w-4 text-white" />
                    Delete this project
                </Button>
                </CardContent>
            </Card>
          )}
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
