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
import type { KanbanUser, Task } from '@/types/kanban';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

type NewTaskDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (taskData: Omit<Task, 'id'>) => Promise<void>;
  members: KanbanUser[];
};

export function NewTaskDialog({ isOpen, onClose, onAddTask, members }: NewTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTask = async () => {
    if (title.trim() && !isSubmitting) {
      setIsSubmitting(true);
      await onAddTask({ title: title.trim(), description: description.trim(), assignee: assigneeId === 'unassigned' ? '' : assigneeId });
      setIsSubmitting(false);
      setTitle('');
      setDescription('');
      setAssigneeId('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleAddTask} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
