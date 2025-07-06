"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import type { KanbanUser, Task } from '@/types/kanban';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format, setHours, setMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

type NewTaskDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>) => Promise<void>;
  members: KanbanUser[];
};

export function NewTaskDialog({ isOpen, onClose, onAddTask, members }: NewTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssigneeId('');
    setPriority('Medium');
    setDeadline(undefined);
    setTime('');
  }

  const handleAddTask = async () => {
    if (title.trim() && !isSubmitting) {
      setIsSubmitting(true);
      let finalDeadline = deadline;
      if (finalDeadline && time) {
          const [hours, minutes] = time.split(':');
          finalDeadline = setMinutes(setHours(finalDeadline, parseInt(hours, 10)), parseInt(minutes, 10));
      } else if (finalDeadline) {
          finalDeadline.setHours(0,0,0,0);
      }
      await onAddTask({ 
        title: title.trim(), 
        description: description.trim(), 
        assignee: assigneeId === 'unassigned' ? '' : assigneeId,
        priority,
        deadline: finalDeadline?.toISOString()
      });
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

  const [currentHour, currentMinute] = time.split(':');

  const handleHourChange = (newHour: string) => {
      setTime(`${newHour}:${currentMinute || '00'}`);
  };

  const handleMinuteChange = (newMinute: string) => {
      setTime(`${currentHour || '00'}:${newMinute}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) resetForm(); onClose();}}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh] p-0">
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Description (optional)</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about the task"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as Task['priority'])}>
                    <SelectTrigger id="task-priority">
                        <SelectValue placeholder="Select a priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="task-assignee">Assignee (optional)</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger id="task-assignee">
                      <SelectValue placeholder="Select an assignee" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members.map(member => (
                          <SelectItem key={member.uid} value={member.uid}>{member.displayName ?? member.email}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Deadline (optional)</Label>
            <div className="flex gap-2">
              <Popover>
                  <PopoverTrigger asChild>
                  <Button
                      variant={"outline"}
                      className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                      )}
                  >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                  </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                  <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={handleDateSelect}
                      initialFocus
                  />
                  </PopoverContent>
              </Popover>
              <div className="flex items-center gap-1">
                <Select value={currentHour} onValueChange={handleHourChange} disabled={!deadline}>
                  <SelectTrigger className="w-[75px]">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="font-bold text-muted-foreground">:</span>
                <Select value={currentMinute} onValueChange={handleMinuteChange} disabled={!deadline}>
                  <SelectTrigger className="w-[75px]">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-assignee">Assignee (optional)</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger id="task-assignee">
                    <SelectValue placeholder="Select an assignee" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map(member => (
                      <SelectItem key={member.uid} value={member.uid}>
                        <div className='flex flex-row justify-between items-center gap-2'>
                          <Avatar className="h-8 w-8 sm:h-4 sm:w-4">
                            <AvatarImage src={member.photoURL ?? ''} alt={member.displayName ?? 'User'} />
                            <AvatarFallback>{member.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                          </Avatar>
                          <p className='text-sm sm:text-xs'>{member.displayName ?? member.email}</p>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="p-6 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleAddTask} disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
