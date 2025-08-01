'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  ListTodo,
  Minus,
  Tag,
  History,
  Send,
} from 'lucide-react';
import type { Task, Column, KanbanUser, Project } from '@/types/kanban';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format, setHours, setMinutes, isPast, isAfter, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '../ui/calendar';
import { Checkbox } from '../ui/checkbox';
import {
  MAX_COMMENT_LENGTH,
  MAX_DESC_LENGTH,
  MAX_SUBTASK_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  TIME_OPTIONS,
} from '@/lib/constants';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '../ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useKanbanStore } from '@/hooks/use-kanban-store';

type TaskDetailsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  task: Task | null;
  columnId: string | null;
  columns: Column[];
  allTasks: Task[];
  members: KanbanUser[];
  onTaskClick: (task: Task, columnId: string) => void;
};

export function TaskDetailsDialog({
  isOpen,
  onClose,
  project,
  task: initialTask,
  columnId: initialColumnId,
  columns,
  allTasks: allProjectTasks,
  members,
  onTaskClick,
}: TaskDetailsDialogProps) {
  const actions = useKanbanStore((state) => state.actions);
  const { user: currentUser } = useAuth();
  const [task, setTask] = useState(initialTask);
  const [columnId, setColumnId] = useState(initialColumnId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [time, setTime] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('details');

  const hours = TIME_OPTIONS.HOURS;
  const minutes = TIME_OPTIONS.MINUTES;

  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const updatedTask = allProjectTasks.find((t) => t.id === initialTask?.id) ?? null;
    setTask(updatedTask);
    setColumnId(initialColumnId);
  }, [initialTask, initialColumnId, allProjectTasks]);

  const subtasks = useMemo(() => {
    if (!task) return [];
    return allProjectTasks
      .filter((t) => t.parentId === task.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [allProjectTasks, task]);

  const parentTask = useMemo(() => {
    if (!task?.parentId) return null;
    return allProjectTasks.find((t) => t.id === task.parentId) ?? null;
  }, [allProjectTasks, task]);

  const completedSubtasks = useMemo(() => subtasks.filter((st) => !!st.completedAt).length, [subtasks]);
  const subtaskProgress = useMemo(
    () => (subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0),
    [subtasks, completedSubtasks],
  );

  const projectLabels = useMemo(() => project.labels ?? [], [project.labels]);
  const enableSubtasks = useMemo(() => project.enableSubtasks ?? true, [project.enableSubtasks]);
  const enableDeadlines = useMemo(() => project.enableDeadlines ?? true, [project.enableDeadlines]);
  const enableLabels = useMemo(() => project.enableLabels ?? true, [project.enableLabels]);

  const activitiesAndComments = useMemo(() => {
    if (!task?.activity) return [];
    return [...task.activity].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [task]);

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || '');
      setAssigneeId(task.assignee || 'unassigned');
      setPriority(task.priority || 'Medium');
      setLabelIds(task.labelIds || []);
      const deadlineDate = task.deadline ? new Date(task.deadline) : undefined;
      setDeadline(deadlineDate);
      if (deadlineDate) {
        const hasTime = deadlineDate.getHours() !== 0 || deadlineDate.getMinutes() !== 0;
        setTime(hasTime ? format(deadlineDate, 'HH:mm') : '');
      } else {
        setTime('');
      }
      setStatus(columnId);
      if (activeTab === '') setActiveTab('details');
    } else {
      setActiveTab('');
    }
  }, [task, columnId, isOpen]);

  const handleDateSelect = (date: Date | undefined) => {
    if (parentTask?.deadline && date && isAfter(date, new Date(parentTask.deadline))) {
      toast({
        variant: 'destructive',
        title: 'Invalid Deadline',
        description: `Sub-task deadline cannot be after the parent task's deadline of ${format(new Date(parentTask.deadline), 'PPP')}.`,
      });
      return;
    }
    setDeadline(date);
    if (!date) {
      setTime('');
    }
  };

  const handleLabelToggle = (labelId: string) => {
    setLabelIds((prev) => (prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]));
  };

  const handleSave = async () => {
    if (!task || !columnId || !status || isSaving) return;

    setIsSaving(true);

    let finalDeadline = deadline;
    if (finalDeadline && time) {
      const [hours, minutes] = time.split(':');
      finalDeadline = setMinutes(setHours(finalDeadline, parseInt(hours, 10)), parseInt(minutes, 10));
    } else if (finalDeadline) {
      finalDeadline.setHours(0, 0, 0, 0);
    }
    const finalDeadlineISO = finalDeadline?.toISOString();

    const updatedData: Partial<Omit<Task, 'id'>> = {};
    const finalAssigneeId = assigneeId === 'unassigned' ? '' : assigneeId;

    if (title.trim() !== task.title) updatedData.title = title.trim();
    if (description.trim() !== (task.description || '')) updatedData.description = description.trim();
    if (finalAssigneeId !== (task.assignee || '')) updatedData.assignee = finalAssigneeId;
    if (priority !== (task.priority || 'Medium')) updatedData.priority = priority;

    const sortedLabelIds = [...labelIds].sort();
    const sortedTaskLabelIds = [...(task.labelIds || [])].sort();
    if (enableLabels && JSON.stringify(sortedLabelIds) !== JSON.stringify(sortedTaskLabelIds)) {
      updatedData.labelIds = sortedLabelIds;
    }

    const currentDeadlineISO = task.deadline ? new Date(task.deadline).toISOString() : undefined;
    if (finalDeadlineISO !== currentDeadlineISO) {
      updatedData.deadline = enableDeadlines ? finalDeadlineISO : undefined;
    }

    const updatePromise =
      Object.keys(updatedData).length > 0
        ? actions.updateTask(project.id, task.id, columnId, updatedData)
        : Promise.resolve();

    const movePromise =
      status !== columnId && !task.parentId
        ? () => {
            const destinationColumn = columns.find((c) => c.id === status);
            const toIndex = destinationColumn ? destinationColumn.tasks.length : 0;
            return actions.moveTask(project.id, task.id, columnId, status, toIndex);
          }
        : () => Promise.resolve();

    await updatePromise;
    await movePromise();

    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!task || !columnId) return;
    await actions.deleteTask(project.id, task.id, columnId);
    setIsDeleteDialogOpen(false);
    onClose();
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !task || !columnId) return;
    const subtaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'> = {
      title: newSubtaskTitle.trim(),
      parentId: task.id,
      priority: 'Medium',
    };
    await actions.addTask(project.id, columnId, subtaskData);
    setNewSubtaskTitle('');
  };

  const handleSubtaskCheck = async (subtask: Task, isChecked: boolean) => {
    if (!task || !columnId) return;
    const updatedData = {
      completedAt: isChecked ? new Date().toISOString() : null,
    };
    await actions.updateTask(project.id, subtask.id, columnId, updatedData as any, {
      subtaskTitle: subtask.title,
    });
  };

  const handleSubtaskClick = (subtask: Task) => {
    if (!columnId) return;
    onTaskClick(subtask, columnId);
  };

  const [currentHour, currentMinute] = time.split(':');

  const handleHourChange = (newHour: string) => {
    setTime(`${newHour}:${currentMinute || '00'}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    setTime(`${currentHour || '00'}:${newMinute}`);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewComment(text);

    const match = /@(\w*)$/.exec(text);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentionPopover(true);
    } else {
      setShowMentionPopover(false);
    }
  };

  const handleMentionSelect = (member: KanbanUser) => {
    const currentText = newComment;
    const mentionStartIndex = currentText.lastIndexOf('@');
    const newText = `${currentText.slice(0, mentionStartIndex)}@${member.displayName} `;
    setNewComment(newText);
    setShowMentionPopover(false);
    commentTextareaRef.current?.focus();
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;
    setIsCommenting(true);

    const mentions = members.filter((m) => newComment.includes(`@${m.displayName}`)).map((m) => m.uid);

    await actions.addComment(project.id, task.id, newComment, mentions);
    setNewComment('');
    setIsCommenting(false);
  };

  const mentionableMembers = (members || []).filter(
    (m) =>
      m.displayName?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  if (!isOpen || !task) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-lg flex flex-col max-h-[90vh] p-0"
        >
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle>{task.parentId ? 'Edit Sub-task' : 'Edit Task'}</DialogTitle>
            <DialogDescription>
              {task.parentId
                ? `Sub-task in "${parentTask?.title}"`
                : "Make changes to your task here. Click save when you're done."}
            </DialogDescription>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col min-h-0">
            <TabsList className="flex-shrink-0 w-full justify-start rounded-none border-b bg-transparent p-0">
              <div className="px-6 flex items-center gap-4">
                <TabsTrigger
                  value="details"
                  className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Comments
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Activity
                </TabsTrigger>
              </div>
            </TabsList>
            <TabsContent value="details" className="grid gap-4 px-6 pb-4 flex-grow overflow-y-auto mt-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design the landing page"
                  maxLength={MAX_TITLE_LENGTH}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {title.length} / {MAX_TITLE_LENGTH}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details about the task"
                  rows={4}
                  maxLength={MAX_DESC_LENGTH}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length} / {MAX_DESC_LENGTH}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select
                    value={priority ?? 'Medium'}
                    onValueChange={(value) => setPriority(value as Task['priority'])}
                  >
                    <SelectTrigger id="task-priority">
                      <SelectValue placeholder="Select a priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urgent">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span>Urgent</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="High">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-4 w-4 text-orange-400" />
                          <span>High</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-blue-400" />
                          <span>Medium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Low">
                        <div className="flex items-center gap-2">
                          <ArrowDown className="h-4 w-4 text-zinc-400" />
                          <span>Low</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-status">Status</Label>
                  <Select value={status ?? ''} onValueChange={setStatus} disabled={!!task.parentId}>
                    <SelectTrigger id="task-status">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-assignee">Assignee</Label>
                  <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger id="task-assignee">
                      <SelectValue placeholder="Select an assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.uid} value={member.uid}>
                          <div className="flex flex-row items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.photoURL ?? ''} alt={member.displayName ?? 'User'} />
                              <AvatarFallback>{member.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                            </Avatar>
                            <p className="text-sm">{member.displayName ?? member.email}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {enableLabels && (
                <div className="space-y-2">
                  <Label>Labels</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Tag className="mr-2 h-4 w-4" />
                        <div className="flex-grow truncate">
                          {labelIds.length > 0
                            ? projectLabels
                                .filter((l) => labelIds.includes(l.id))
                                .map((l) => l.name)
                                .join(', ')
                            : 'Select labels'}
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <div className="p-2 space-y-1">
                        {projectLabels.length > 0 ? (
                          projectLabels.map((label) => (
                            <div
                              key={label.id}
                              className="flex items-center gap-2 p-1.5 rounded-md md:hover:bg-muted cursor-pointer"
                              onClick={() => handleLabelToggle(label.id)}
                            >
                              <Checkbox checked={labelIds.includes(label.id)} />
                              <Badge
                                variant="secondary"
                                style={{
                                  backgroundColor: label.color,
                                  color: 'white',
                                }}
                              >
                                {label.name}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="p-2 text-xs text-muted-foreground">
                            No labels in this project. Create some in the project settings.
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              {enableDeadlines && (
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !deadline && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deadline ? format(deadline, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={deadline}
                          onSelect={handleDateSelect}
                          disabled={(date) =>
                            (parentTask?.deadline && isAfter(date, new Date(parentTask.deadline))) || false
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="flex items-center gap-1">
                      <Select value={currentHour} onValueChange={handleHourChange} disabled={!deadline}>
                        <SelectTrigger className="w-full md:w-[75px]">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {hours.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="font-bold text-muted-foreground">:</span>
                      <Select value={currentMinute} onValueChange={handleMinuteChange} disabled={!deadline}>
                        <SelectTrigger className="w-full md:w-[75px]">
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent>
                          {minutes.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              {!task.parentId && enableSubtasks && (
                <div className="space-y-4 pt-2">
                  <Separator />
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ListTodo className="h-4 w-4" /> Sub-tasks
                    </Label>
                    {subtasks.length > 0 && (
                      <div className="space-y-2">
                        <Progress value={subtaskProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {completedSubtasks} of {subtasks.length} sub-tasks completed
                        </p>
                      </div>
                    )}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-md md:hover:bg-muted/50">
                          <Checkbox
                            id={`subtask-${subtask.id}`}
                            checked={!!subtask.completedAt}
                            onCheckedChange={(checked) => handleSubtaskCheck(subtask, !!checked)}
                          />
                          <div className="flex-grow cursor-pointer" onClick={() => handleSubtaskClick(subtask)}>
                            <label
                              htmlFor={`subtask-${subtask.id}`}
                              className={cn(
                                'text-sm flex-grow',
                                subtask.completedAt && 'line-through text-muted-foreground',
                              )}
                            >
                              {subtask.title}
                            </label>
                            {subtask.deadline && enableDeadlines && (
                              <p
                                className={cn(
                                  'text-xs',
                                  subtask.completedAt
                                    ? 'text-muted-foreground/80'
                                    : isPast(new Date(subtask.deadline))
                                      ? 'text-destructive'
                                      : 'text-muted-foreground',
                                )}
                              >
                                {format(new Date(subtask.deadline), 'MMM d')}
                              </p>
                            )}
                          </div>
                          {subtask.assignee && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={members.find((m) => m.uid === subtask.assignee)?.photoURL ?? ''} />
                              <AvatarFallback>
                                {members
                                  .find((m) => m.uid === subtask.assignee)
                                  ?.displayName?.charAt(0)
                                  .toUpperCase() ?? 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="flex-grow space-y-1">
                        <Input
                          placeholder="Add a new sub-task..."
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                          maxLength={MAX_SUBTASK_TITLE_LENGTH}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {newSubtaskTitle.length} / {MAX_SUBTASK_TITLE_LENGTH}
                        </p>
                      </div>
                      <Button onClick={handleAddSubtask} size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="comments" className="px-6 pb-4 flex-grow flex flex-col gap-4 overflow-y-auto mt-4">
              <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                {activitiesAndComments
                  .filter((a) => a.type === 'comment')
                  .map((act) => {
                    const member = members.find((m) => m.uid === act.userId);
                    return (
                      <div key={act.id} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={member?.photoURL ?? undefined} alt={member?.displayName ?? 'User'} />
                          <AvatarFallback>{member?.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{member?.displayName ?? 'A user'}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                          <div
                            className="prose prose-sm dark:prose-invert text-foreground text-sm"
                            dangerouslySetInnerHTML={{
                              __html: act.text.replace(/@(\w+(\s\w+)*)/g, '<strong>@$1</strong>'),
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="relative">
                <Popover open={showMentionPopover} onOpenChange={setShowMentionPopover}>
                  <PopoverTrigger asChild>
                    <div className="w-full"></div>
                  </PopoverTrigger>
                  <PopoverContent className="p-1 w-[--radix-popover-trigger-width]">
                    <div className="max-h-48 overflow-y-auto">
                      {mentionableMembers.map((member) => (
                        <div
                          key={member.uid}
                          onClick={() => handleMentionSelect(member)}
                          className="flex items-center gap-2 p-2 rounded-md md:hover:bg-accent cursor-pointer"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.photoURL ?? ''} />
                            <AvatarFallback>{member.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.displayName}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex items-start gap-2">
                  <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                    <AvatarImage src={currentUser?.photoURL ?? ''} />
                    <AvatarFallback>{currentUser?.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow space-y-1">
                    <Textarea
                      ref={commentTextareaRef}
                      value={newComment}
                      onChange={handleCommentChange}
                      placeholder="Add a comment... Type @ to mention a user."
                      className="min-h-[60px]"
                      disabled={isCommenting}
                      maxLength={MAX_COMMENT_LENGTH}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {newComment.length} / {MAX_COMMENT_LENGTH}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim() || isCommenting}>
                        {isCommenting ? (
                          'Saving...'
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" /> Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="activity" className="px-6 pb-4 flex-grow overflow-y-auto mt-4">
              <div className="space-y-4">
                {activitiesAndComments.map((act) => {
                  const member = members.find((m) => m.uid === act.userId);
                  const isComment = act.type === 'comment';
                  return (
                    <div key={act.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {isComment ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member?.photoURL ?? undefined} alt={member?.displayName ?? 'User'} />
                            <AvatarFallback>{member?.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8 flex items-center justify-center bg-muted rounded-full">
                            <History className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-semibold">{member?.displayName ?? 'A user'}</span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: ` ${act.text.replace(/@(\w+(\s\w+)*)/g, '<strong>@$1</strong>')}`,
                            }}
                          />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(act.timestamp), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(!task.activity || task.activity.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="mx-auto h-8 w-8 mb-2" />
                    <p>No activity recorded for this task yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <div className="p-6 pt-4 border-t flex-shrink-0">
            <div className="flex justify-between items-center gap-2">
              <Button variant="destructive" size="default" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline-block">Delete {task.parentId ? 'sub-task' : 'task'}</span>
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this task
              {subtasks.length > 0 && ' and all of its sub-tasks'} from the board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
