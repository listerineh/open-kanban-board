"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Trash2 } from 'lucide-react';
import type { Task, Column, KanbanUser } from '@/types/kanban';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

type TaskDetailsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  columnId: string | null;
  columns: Column[];
  members: KanbanUser[];
  onUpdateTask: (taskId: string, columnId: string, updatedData: Partial<Omit<Task, 'id'>>) => Promise<void>;
  onDeleteTask: (taskId: string, columnId: string) => Promise<void>;
  onMoveTask: (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => Promise<void>;
};

export function TaskDetailsDialog({
  isOpen,
  onClose,
  task,
  columnId,
  columns,
  members,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
}: TaskDetailsDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || '');
      setAssigneeId(task.assignee || 'unassigned');
      setPriority(task.priority || 'Medium');
      setStatus(columnId);
    }
  }, [task, columnId, isOpen]);

  const handleSave = async () => {
    if (!task || !columnId || !status || isSaving) return;

    setIsSaving(true);
    
    const updatedData: Partial<Omit<Task, 'id'>> = {};
    const finalAssigneeId = assigneeId === 'unassigned' ? '' : assigneeId;
    if (title.trim() !== task.title) updatedData.title = title.trim();
    if (description.trim() !== (task.description || '')) updatedData.description = description.trim();
    if (finalAssigneeId !== (task.assignee || '')) updatedData.assignee = finalAssigneeId;
    if (priority !== (task.priority || 'Medium')) updatedData.priority = priority;

    const updatePromise = Object.keys(updatedData).length > 0 
      ? onUpdateTask(task.id, columnId, updatedData)
      : Promise.resolve();

    const movePromise = status !== columnId
      ? () => {
        const destinationColumn = columns.find(c => c.id === status);
        const toIndex = destinationColumn ? destinationColumn.tasks.length : 0;
        return onMoveTask(task.id, columnId, status, toIndex);
      }
      : () => Promise.resolve();
      
    await updatePromise;
    await movePromise();

    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!task || !columnId) return;
    await onDeleteTask(task.id, columnId);
    setIsDeleteDialogOpen(false);
    onClose();
  };

  if (!isOpen || !task) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Make changes to your task here. Click save when you're done.
            </DialogDescription>
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
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about the task"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={priority ?? 'Medium'} onValueChange={(value) => setPriority(value as Task['priority'])}>
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
            <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assignee</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger id="task-assignee">
                        <SelectValue placeholder="Select an assignee" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members.map(member => ( 
                          <SelectItem key={member.uid} value={member.uid}>
                            <div className='flex flex-row justify-between items-center gap-2'>
                              <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                                <AvatarImage src={member.photoURL ?? ''} alt={member.displayName ?? 'User'} />
                                <AvatarFallback>{member.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                              </Avatar>
                              <p className='sm:text-md text-sm'>{member.displayName ?? member.email}</p>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-status">Status</Label>
                <Select value={status ?? ''} onValueChange={setStatus}>
                  <SelectTrigger id="task-status">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="justify-between sm:justify-between gap-2 flex-col">
            <Button variant="destructive" size="default" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" /> Delete task
              <span className="sr-only">Delete Task</span>
            </Button>
            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" onClick={handleSave} disabled={isSaving} className='w-full'>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this task
              from the board.
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
