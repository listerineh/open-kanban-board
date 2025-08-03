
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useKanbanStore } from '@/hooks/use-kanban-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Clock, ListTodo, Users, AlertTriangle, Archive, PackageOpen, MoreHorizontal, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Project, KanbanUser, Task } from '@/types/kanban';
import { FullPageLoader } from '@/components/common/loader';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/auth/user-nav';
import { StatCard } from '@/components/dashboard/StatCard';
import { isPast, parseISO, format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TaskDetailsDialog } from '@/components/kanban/TaskDetailsDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function AllTasksPage() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };
  const { projects, isLoaded, actions } = useKanbanStore();
  const { loading: authLoading } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<KanbanUser[]>([]);
  const [editingTask, setEditingTask] = useState<{ task: Task; columnId: string } | null>(null);

  useEffect(() => {
    if (authLoading || !isLoaded) return;
  
    const foundProject = projects.find(p => p.id === projectId);
  
    if (foundProject) {
      setProject(foundProject);
      actions.getProjectMembers(projectId).then(setMembers);
    } else {
      router.replace('/404');
    }
  }, [projectId, projects, isLoaded, authLoading, router, actions]);

  const allTasks = useMemo(() => {
    if (!project) return [];
    return project.columns.flatMap(col => 
        col.tasks.map(task => ({ ...task, status: col.title }))
    ).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [project]);

  const stats = useMemo(() => {
    const totalTasks = allTasks.length;
    const activeTasks = allTasks.filter(t => !t.completedAt && !t.isArchived).length;
    const archivedTasks = allTasks.filter(t => t.isArchived).length;
    
    return {
        totalTasks,
        activeTasks,
        archivedTasks
    }
  }, [allTasks]);
  
  const closeTaskDialog = () => {
    setEditingTask(null);
  };
  
  const onTaskClick = (task: Task) => {
    if(!project) return;
    const column = project.columns.find(c => c.tasks.some(t => t.id === task.id));
    if (column) {
      setEditingTask({ task, columnId: column.id });
    }
  };


  if (authLoading || !isLoaded || !project) {
    return <FullPageLoader text="Loading task history..." />;
  }

  const getPriorityStyles = (priority: Task['priority']) => {
    switch (priority) {
      case 'Urgent': return 'text-red-500';
      case 'High': return 'text-orange-500';
      case 'Medium': return 'text-blue-500';
      case 'Low': return 'text-zinc-500';
      default: return 'text-muted-foreground';
    }
  }

  return (
    <>
    <div className="h-dvh bg-background text-foreground overflow-y-auto">
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <header className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push(`/p/${projectId}`)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">All Tasks</h1>
                    <p className="text-muted-foreground">History for "{project.name}"</p>
                </div>
            </div>
            <UserNav />
        </header>
        
        <main className="space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Tasks" value={stats.totalTasks} icon={<ListTodo className="h-5 w-5 text-muted-foreground"/>} />
                <StatCard title="Active Tasks" value={stats.activeTasks} icon={<PackageOpen className="h-5 w-5 text-muted-foreground"/>} />
                <StatCard title="Archived Tasks" value={stats.archivedTasks} icon={<Archive className="h-5 w-5 text-muted-foreground"/>} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Task Log</CardTitle>
                    <CardDescription>A complete log of all tasks within this project.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Task</TableHead>
                                <TableHead className="hidden md:table-cell">Status</TableHead>
                                <TableHead className="hidden md:table-cell">Assignee</TableHead>
                                <TableHead className="hidden sm:table-cell">Priority</TableHead>
                                <TableHead className="hidden sm:table-cell">Last Updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allTasks.map(task => {
                                const assignee = members.find(m => m.uid === task.assignee);
                                return (
                                    <TableRow 
                                      key={task.id} 
                                      className="cursor-pointer"
                                      onClick={() => onTaskClick(task)}
                                    >
                                        <TableCell className="font-medium">
                                          <div className='flex items-center gap-2'>
                                            {task.isArchived && <Archive className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                                            <span className='truncate' title={task.title}>{task.title}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant={task.status === 'Done' ? 'default' : 'secondary'}>{task.status}</Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {assignee ? (
                                                 <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={assignee.photoURL ?? ''} />
                                                        <AvatarFallback>{assignee.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <span className='truncate'>{assignee.displayName}</span>
                                                 </div>
                                            ) : (
                                                <span className="text-muted-foreground">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className={`hidden sm:table-cell font-medium ${getPriorityStyles(task.priority)}`}>
                                            {task.priority || 'Medium'}
                                        </TableCell>
                                         <TableCell className="hidden sm:table-cell text-muted-foreground">
                                            {format(new Date(task.updatedAt), 'MMM d, yyyy')}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
      </div>
    </div>
    <TaskDetailsDialog
        isOpen={!!editingTask}
        onClose={closeTaskDialog}
        project={project}
        task={editingTask?.task ?? null}
        columnId={editingTask?.columnId ?? null}
        columns={project.columns}
        allTasks={allTasks}
        members={members}
        onTaskClick={onTaskClick}
      />
    </>
  );
}
