'use client';

import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar as CalendarIcon,
  Minus,
  Tag,
  Users,
  Check,
  Upload,
  X,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import type { KanbanUser, Task, Project, Attachment } from '@/types/kanban';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format, setHours, setMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { MAX_DESC_LENGTH, MAX_TITLE_LENGTH, TIME_OPTIONS } from '@/lib/constants';
import { useKanbanStore } from '@/hooks/use-kanban-store';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Loader } from '../common/loader';

type NewTaskDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  columnId: string;
  members: KanbanUser[];
};

const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Could not get canvas context');

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export function NewTaskDialog({ isOpen, onClose, members, project, columnId }: NewTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTask = useKanbanStore((state) => state.actions.addTask);

  const hours = TIME_OPTIONS.HOURS;
  const minutes = TIME_OPTIONS.MINUTES;

  const enableDeadlines = useMemo(() => project.enableDeadlines ?? true, [project.enableDeadlines]);
  const enableLabels = useMemo(() => project.enableLabels ?? true, [project.enableLabels]);
  const projectLabels = useMemo(() => project.labels ?? [], [project.labels]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssigneeIds([]);
    setPriority('Medium');
    setDeadline(undefined);
    setTime('');
    setLabelIds([]);
    setAttachments([]);
  };

  const handleAddTask = async () => {
    if (title.trim() && !isSubmitting) {
      setIsSubmitting(true);

      let finalDeadline = deadline;
      if (finalDeadline && time) {
        const [hours, minutes] = time.split(':');
        finalDeadline = setMinutes(setHours(finalDeadline, parseInt(hours, 10)), parseInt(minutes, 10));
      } else if (finalDeadline) {
        finalDeadline.setHours(0, 0, 0, 0);
      }

      const taskData: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>> = {
        title: title.trim(),
        priority,
      };

      if (description.trim()) taskData.description = description.trim();
      if (assigneeIds.length > 0) taskData.assigneeIds = assigneeIds;
      if (finalDeadline && enableDeadlines) taskData.deadline = finalDeadline.toISOString();
      if (labelIds.length > 0 && enableLabels) taskData.labelIds = labelIds;
      if (attachments.length > 0) taskData.attachments = attachments;

      await addTask(
        project.id,
        columnId,
        taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'activity' | 'projectId'>,
      );
      setIsSubmitting(false);
      resetForm();
      onClose();
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setDeadline(date);
    if (!date) {
      setTime('');
    }
  };

  const handleLabelToggle = (labelId: string) => {
    setLabelIds((prev) => (prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]));
  };

  const handleAssigneeToggle = (assigneeId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(assigneeId) ? prev.filter((id) => id !== assigneeId) : [...prev, assigneeId],
    );
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];

    event.target.value = '';

    setIsUploading(true);
    try {
      const dataUrl = await resizeImage(file, 800, 800, 0.8);
      const newAttachment: Attachment = {
        id: `att-${Date.now()}-${file.name}`,
        name: file.name,
        url: dataUrl,
        type: 'image/webp',
        createdAt: new Date().toISOString(),
      };
      setAttachments((prev) => [...prev, newAttachment]);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
  };

  const [currentHour, currentMinute] = time.split(':');

  const handleHourChange = (newHour: string) => {
    setTime(`${newHour}:${currentMinute || '00'}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    setTime(`${currentHour || '00'}:${newMinute}`);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-2xl flex flex-col max-h-[90vh] p-0"
      >
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 px-6 pb-4 flex-grow overflow-y-auto">
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
            <Label htmlFor="task-description">Description (optional)</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about the task"
              maxLength={MAX_DESC_LENGTH}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length} / {MAX_DESC_LENGTH}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-priority">Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as Task['priority'])}>
              <SelectTrigger id="task-priority" className="w-full">
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
          {enableDeadlines && (
            <div className="space-y-2">
              <Label>Deadline (optional)</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn('w-full justify-start text-left font-normal', !deadline && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={deadline} onSelect={handleDateSelect} initialFocus />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-1">
                  <Select value={currentHour} onValueChange={handleHourChange} disabled={!deadline}>
                    <SelectTrigger className="w-full sm:w-[75px]">
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
                    <SelectTrigger className="w-full sm:w-[75px]">
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
          <div className="space-y-2">
            <Label>Assignees (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal h-auto">
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex-grow flex flex-wrap gap-1">
                    {assigneeIds.length > 0
                      ? members
                          .filter((m) => assigneeIds.includes(m.uid))
                          .map((m) => (
                            <Badge key={m.uid} variant="secondary">
                              {m.displayName}
                            </Badge>
                          ))
                      : 'Select assignees'}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Filter members..." />
                  <CommandList>
                    <CommandEmpty>No members found.</CommandEmpty>
                    <CommandGroup>
                      {members.map((member) => (
                        <CommandItem
                          key={member.uid}
                          onSelect={() => handleAssigneeToggle(member.uid)}
                          className="cursor-pointer"
                        >
                          <div
                            className={cn(
                              'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                              assigneeIds.includes(member.uid)
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
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <div className="p-2 space-y-1">
                    {projectLabels.map((label) => (
                      <div
                        key={label.id}
                        className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted cursor-pointer"
                        onClick={() => handleLabelToggle(label.id)}
                      >
                        <Checkbox checked={labelIds.includes(label.id)} />
                        <Badge variant="secondary" style={{ backgroundColor: label.color, color: 'white' }}>
                          {label.name}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
          <div className="space-y-2">
            <Label>Attachments (optional)</Label>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-3 p-2 rounded-md border">
                  <div className="flex-shrink-0 h-10 w-10 bg-muted rounded-md flex items-center justify-center">
                    <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover rounded-md" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">Image will be attached on creation</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
            {isUploading ? (
              <Loader text="Processing image..." />
            ) : (
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="mt-2">
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            )}
          </div>
        </div>
        <DialogFooter className="p-6 border-t flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleAddTask} disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
