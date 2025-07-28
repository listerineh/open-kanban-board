'use client';

import { useKanbanStore } from '@/hooks/use-kanban-store';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Search, X, Settings, LayoutDashboard, Filter, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/auth/user-nav';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Project, Task, KanbanUser } from '@/types/kanban';
import { KanbanBoardSkeleton } from '@/components/common/skeletons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Notifications } from '@/components/notifications/Notifications';
import { TaskDetailsDialog } from '@/components/kanban/TaskDetailsDialog';
import { AppIcon } from '@/components/common/AppIcon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { TASK_PRIORITIES, STORAGE_KEYS } from '@/lib/constants';

function ProjectPageContent() {
  const store = useKanbanStore();
  const { loading: authLoading } = useAuth();
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();
  const searchParams = useSearchParams();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<KanbanUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState<{ task: Task; columnId: string } | null>(null);

  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(new Set());
  const [selectedPriorities, setSelectedPriorities] = useState<Set<string>>(new Set());
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authLoading || !store.isLoaded) {
      return;
    }

    const foundProject = store.projects.find((p) => p.id === projectId);

    if (foundProject) {
      setProject(foundProject);
      store.getProjectMembers(projectId).then(setMembers);
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_PROJECT, projectId);
      } catch (error) {
        console.error('Failed to write to localStorage', error);
      }
      const taskId = searchParams.get('taskId');
      if (taskId) {
        const allTasks = foundProject.columns.flatMap((c) => c.tasks);
        const taskToOpen = allTasks.find((t) => t.id === taskId);
        if (taskToOpen) {
          const column = foundProject.columns.find((c) => c.tasks.some((t) => t.id === taskId));
          if (column) {
            setEditingTask({ task: taskToOpen, columnId: column.id });
          }
        }
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVE_PROJECT);
      } catch (error) {
        console.error('Failed to remove from localStorage', error);
      }
      router.replace('/');
    }
  }, [projectId, authLoading, store.isLoaded, store.projects, router, searchParams, store]);

  const closeTaskDialog = () => {
    setEditingTask(null);
    router.replace(`/p/${projectId}`, { scroll: false });
  };

  const handleHomeClick = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVE_PROJECT);
    } catch (error) {
      console.error('Failed to remove from localStorage', error);
    }
  };

  const toggleFilter = (set: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
    set((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSelectedAssignees(new Set());
    setSelectedPriorities(new Set());
    setSelectedLabels(new Set());
  };

  const activeFilterCount = selectedAssignees.size + selectedPriorities.size + selectedLabels.size;

  const filteredProject = useMemo(() => {
    if (!project) return null;

    const allTasks = project.columns.flatMap((c) => c.tasks);
    let filteredTasks = new Set(allTasks);

    // Search query filter
    if (searchQuery) {
      filteredTasks = new Set(
        [...filteredTasks].filter(
          (task) =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      );
    }

    // Assignee filter
    if (selectedAssignees.size > 0) {
      filteredTasks = new Set(
        [...filteredTasks].filter((task) => selectedAssignees.has(task.assignee || 'unassigned')),
      );
    }

    // Priority filter
    if (selectedPriorities.size > 0) {
      filteredTasks = new Set([...filteredTasks].filter((task) => selectedPriorities.has(task.priority || 'Medium')));
    }

    // Label filter
    if (selectedLabels.size > 0) {
      filteredTasks = new Set(
        [...filteredTasks].filter((task) => task.labelIds?.some((labelId) => selectedLabels.has(labelId))),
      );
    }

    return {
      ...project,
      columns: project.columns.map((column) => ({
        ...column,
        tasks: column.tasks.filter((task) => filteredTasks.has(task)),
      })),
    };
  }, [project, searchQuery, selectedAssignees, selectedPriorities, selectedLabels]);

  if (authLoading || !store.isLoaded || !project || !filteredProject) {
    return <KanbanBoardSkeleton />;
  }

  const enableDashboard = project.enableDashboard ?? true;
  const allTasks = project.columns.flatMap((c) => c.tasks);
  const projectLabels = project.labels || [];
  const priorities: Task['priority'][] = [...TASK_PRIORITIES];

  const FilterPopoverContent = () => (
    <PopoverContent className="w-80 p-0" align="end">
      <Command>
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-medium text-sm">Filters</h4>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
          >
            Clear all
          </Button>
        </div>
        <CommandList className="max-h-[400px]">
          <CommandGroup heading="Assignee">
            {members.map((member) => (
              <CommandItem key={member.uid} onSelect={() => toggleFilter(setSelectedAssignees, member.uid)}>
                <div
                  className={cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selectedAssignees.has(member.uid)
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible',
                  )}
                >
                  <Check className="h-4 w-4" />
                </div>
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={member.photoURL ?? ''} />
                  <AvatarFallback>{member.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
                <span>{member.displayName}</span>
              </CommandItem>
            ))}
            <CommandItem onSelect={() => toggleFilter(setSelectedAssignees, 'unassigned')}>
              <div
                className={cn(
                  'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                  selectedAssignees.has('unassigned')
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible',
                )}
              >
                <Check className="h-4 w-4" />
              </div>
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <span>Unassigned</span>
            </CommandItem>
          </CommandGroup>
          <Separator />
          <CommandGroup heading="Priority">
            {priorities.map((p) => (
              <CommandItem key={p} onSelect={() => toggleFilter(setSelectedPriorities, p!)}>
                <div
                  className={cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selectedPriorities.has(p!) ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                  )}
                >
                  <Check className="h-4 w-4" />
                </div>
                <span>{p}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          {projectLabels.length > 0 && (
            <>
              <Separator />
              <CommandGroup heading="Labels">
                {projectLabels.map((label) => (
                  <CommandItem key={label.id} onSelect={() => toggleFilter(setSelectedLabels, label.id)}>
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        selectedLabels.has(label.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: label.color }}></div>
                    <span>{label.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </PopoverContent>
  );

  return (
    <>
      <div className="w-full flex flex-col bg-background text-foreground font-body min-h-0 h-dvh max-h-dvh">
        <header className="px-4 py-3 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          {/* Desktop Layout */}
          <div className="hidden md:flex flex-1 items-center justify-start min-w-0">
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
          </div>

          <div className="hidden md:flex flex-1 items-center justify-center gap-2">
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <FilterPopoverContent />
            </Popover>
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
            <div className="w-full flex items-center justify-between">
              <div className="relative">
                <Link href="/" className="inline-flex items-center justify-center gap-3" onClick={handleHomeClick}>
                  <AppIcon className="h-6 w-6" />
                  <h1 className="text-xl font-headline font-bold">OpenKanban</h1>
                </Link>
                <Badge
                  variant="secondary"
                  className="absolute -right-4 -bottom-2 text-[10px] scale-90 px-1.5 py-0.5 pointer-events-none"
                >
                  alpha
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {enableDashboard && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/p/${project.id}/dashboard`} passHref>
                        <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8 rounded-full">
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
                      <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8 rounded-full">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Project Settings</p>
                  </TooltipContent>
                </Tooltip>
                <div className="sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <ChevronDown className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {enableDashboard && (
                        <DropdownMenuItem onSelect={() => router.push(`/p/${project.id}/dashboard`)}>
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => router.push(`/p/${project.id}/config`)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Notifications />
                <UserNav />
              </div>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative flex-shrink-0">
                    <Filter className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <FilterPopoverContent />
              </Popover>
            </div>
          </div>
        </header>
        <main className="flex-1 min-w-0 min-h-0 w-full max-w-full overflow-x-auto flex flex-col h-screen max-h-screen">
          <KanbanBoard
            key={project.id}
            project={filteredProject}
            store={store}
            onTaskClick={(task, columnId) => {
              setEditingTask({ task, columnId });
              router.push(`/p/${projectId}?taskId=${task.id}`, { scroll: false });
            }}
          />
        </main>
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
        onUpdateTask={store.updateTask}
        onDeleteTask={store.deleteTask}
        onMoveTask={store.moveTask}
        onAddTask={store.addTask}
        onTaskClick={(task, columnId) => {
          setEditingTask({ task, columnId });
          router.push(`/p/${projectId}?taskId=${task.id}`, { scroll: false });
        }}
      />
    </>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<KanbanBoardSkeleton />}>
      <ProjectPageContent />
    </Suspense>
  );
}
