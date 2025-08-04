'use client';

import { useParams, useRouter } from 'next/navigation';
import { useKanbanStore } from '@/hooks/use-kanban-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Filter, ListTodo, PackageOpen, Archive, Search, X, ArrowUp, ArrowDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Project, KanbanUser, Task, Label as LabelType } from '@/types/kanban';
import { FullPageLoader } from '@/components/common/loader';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/auth/user-nav';
import { StatCard } from '@/components/dashboard/StatCard';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TaskDetailsDialog } from '@/components/kanban/TaskDetailsDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { FILTERS_SORT_DIRECTION, FILTERS_SORTABLE_KEYS } from '@/lib/constants';

export default function AllTasksPage() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };
  const { projects, isLoaded, actions } = useKanbanStore();
  const { loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<KanbanUser[]>([]);
  const [editingTask, setEditingTask] = useState<{ task: Task; columnId: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(new Set());
  const [selectedPriorities, setSelectedPriorities] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: FILTERS_SORTABLE_KEYS; direction: FILTERS_SORT_DIRECTION }>({
    key: 'updatedAt',
    direction: 'desc',
  });

  useEffect(() => {
    if (authLoading || !isLoaded) return;

    const foundProject = projects.find((p) => p.id === projectId);

    if (foundProject) {
      setProject(foundProject);
      actions.getProjectMembers(projectId).then(setMembers);
    } else {
      router.replace('/404');
    }
  }, [projectId, projects, isLoaded, authLoading, router, actions]);

  const allTasks = useMemo(() => {
    if (!project) return [];
    return project.columns.flatMap((col) => col.tasks.map((task) => ({ ...task, status: col.title })));
  }, [project]);

  const sortedTasks = useMemo(() => {
    let filtered = allTasks;

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(lowerCaseQuery) || task.description?.toLowerCase().includes(lowerCaseQuery),
      );
    }

    if (selectedAssignees.size > 0) {
      filtered = filtered.filter((task) => selectedAssignees.has(task.assignee || 'unassigned'));
    }

    if (selectedPriorities.size > 0) {
      filtered = filtered.filter((task) => selectedPriorities.has(task.priority || 'Medium'));
    }

    if (selectedStatuses.size > 0) {
      filtered = filtered.filter((task) => selectedStatuses.has(task.status));
    }

    const priorityOrder: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };

    const sorted = [...filtered].sort((a, b) => {
      let compare = 0;

      switch (sortConfig.key) {
        case 'title':
        case 'status':
          compare = a[sortConfig.key].localeCompare(b[sortConfig.key]);
          break;
        case 'updatedAt':
          compare = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'priority':
          const aPriority = priorityOrder[a.priority ?? 'Medium'] ?? 0;
          const bPriority = priorityOrder[b.priority ?? 'Medium'] ?? 0;
          compare = aPriority - bPriority;
          break;
        case 'assignee':
          const aName = members.find((m) => m.uid === a.assignee)?.displayName ?? 'zzzz'; // 'zzzz' to put unassigned last
          const bName = members.find((m) => m.uid === b.assignee)?.displayName ?? 'zzzz';
          compare = aName.localeCompare(bName);
          break;
      }

      return sortConfig.direction === 'asc' ? compare : -compare;
    });

    return sorted;
  }, [allTasks, searchQuery, selectedStatuses, selectedAssignees, selectedPriorities, sortConfig, members]);

  const stats = useMemo(() => {
    const totalTasks = allTasks.length;
    const activeTasks = allTasks.filter((t) => !t.completedAt && !t.isArchived).length;
    const archivedTasks = allTasks.filter((t) => t.isArchived).length;

    return {
      totalTasks,
      activeTasks,
      archivedTasks,
    };
  }, [allTasks]);

  const closeTaskDialog = () => {
    setEditingTask(null);
  };

  const onTaskClick = (task: Task) => {
    if (!project) return;
    const column = project.columns.find((c) => c.tasks.some((t) => t.id === task.id));
    if (column) {
      setEditingTask({ task, columnId: column.id });
    }
  };

  const toggleFilter = (type: 'statuses' | 'assignees' | 'priorities', value: string) => {
    const updater = (prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    };
    if (type === 'statuses') setSelectedStatuses(updater);
    if (type === 'assignees') setSelectedAssignees(updater);
    if (type === 'priorities') setSelectedPriorities(updater);
  };

  const clearFilters = () => {
    setSelectedStatuses(new Set());
    setSelectedAssignees(new Set());
    setSelectedPriorities(new Set());
  };

  const activeFilterCount = useMemo(
    () => selectedStatuses.size + selectedAssignees.size + selectedPriorities.size,
    [selectedStatuses, selectedAssignees, selectedPriorities],
  );

  const requestSort = (key: FILTERS_SORTABLE_KEYS) => {
    let direction: FILTERS_SORT_DIRECTION = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: FILTERS_SORTABLE_KEYS) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  if (authLoading || !isLoaded || !project) {
    return <FullPageLoader text="Loading task history..." />;
  }

  const getPriorityStyles = (priority: Task['priority']) => {
    switch (priority) {
      case 'Urgent':
        return 'text-red-500';
      case 'High':
        return 'text-orange-500';
      case 'Medium':
        return 'text-blue-500';
      case 'Low':
        return 'text-zinc-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const SortableHeader = ({
    sortKey,
    children,
    className,
  }: {
    sortKey: FILTERS_SORTABLE_KEYS;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead className={className}>
      <Button variant="link" onClick={() => requestSort(sortKey)} className="px-2 py-1 h-auto -ml-2">
        {children}
        <span className="ml-2">{getSortIcon(sortKey)}</span>
      </Button>
    </TableHead>
  );

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
              <StatCard
                title="Total Tasks"
                value={stats.totalTasks}
                icon={<ListTodo className="h-5 w-5 text-muted-foreground" />}
              />
              <StatCard
                title="Active Tasks"
                value={stats.activeTasks}
                icon={<PackageOpen className="h-5 w-5 text-muted-foreground" />}
              />
              <StatCard
                title="Archived Tasks"
                value={stats.archivedTasks}
                icon={<Archive className="h-5 w-5 text-muted-foreground" />}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Task Log</CardTitle>
                <CardDescription>A complete log of all tasks within this project.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
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
                          <CommandGroup heading="Status">
                            {project.columns.map((col) => (
                              <CommandItem key={col.id} onSelect={() => toggleFilter('statuses', col.title)}>
                                <div
                                  className={cn(
                                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                    selectedStatuses.has(col.title)
                                      ? 'bg-primary text-primary-foreground'
                                      : 'opacity-50 [&_svg]:invisible',
                                  )}
                                >
                                  <Check className="h-4 w-4" />
                                </div>
                                <span>{col.title}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <Separator />
                          <CommandGroup heading="Assignee">
                            {members.map((member) => (
                              <CommandItem key={member.uid} onSelect={() => toggleFilter('assignees', member.uid)}>
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
                            <CommandItem onSelect={() => toggleFilter('assignees', 'unassigned')}>
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
                            {['Urgent', 'High', 'Medium', 'Low'].map((p) => (
                              <CommandItem key={p} onSelect={() => toggleFilter('priorities', p!)}>
                                <div
                                  className={cn(
                                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                    selectedPriorities.has(p!)
                                      ? 'bg-primary text-primary-foreground'
                                      : 'opacity-50 [&_svg]:invisible',
                                  )}
                                >
                                  <Check className="h-4 w-4" />
                                </div>
                                <span>{p}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHeader sortKey="title">Task</SortableHeader>
                        <SortableHeader sortKey="status" className="hidden md:table-cell">
                          Status
                        </SortableHeader>
                        <SortableHeader sortKey="assignee" className="hidden md:table-cell">
                          Assignee
                        </SortableHeader>
                        <SortableHeader sortKey="priority" className="hidden sm:table-cell">
                          Priority
                        </SortableHeader>
                        <SortableHeader sortKey="updatedAt" className="hidden sm:table-cell">
                          Last Updated
                        </SortableHeader>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTasks.length > 0 ? (
                        sortedTasks.map((task) => {
                          const assignee = members.find((m) => m.uid === task.assignee);
                          return (
                            <TableRow key={task.id} className="cursor-pointer" onClick={() => onTaskClick(task)}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {task.isArchived && (
                                    <Archive className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span className="truncate" title={task.title}>
                                    {task.title}
                                  </span>
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
                                    <span className="truncate">{assignee.displayName}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Unassigned</span>
                                )}
                              </TableCell>
                              <TableCell
                                className={`hidden sm:table-cell font-medium ${getPriorityStyles(task.priority)}`}
                              >
                                {task.priority || 'Medium'}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-muted-foreground">
                                {format(new Date(task.updatedAt), 'MMM d, yyyy')}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No tasks found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      {editingTask && (
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
      )}
    </>
  );
}
