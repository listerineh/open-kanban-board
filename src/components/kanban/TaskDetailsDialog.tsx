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
import type { Task, Column } from '@/types/kanban';

type TaskDetailsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  columnId: string | null;
  columns: Column[];
  onUpdateTask: (taskId: string, columnId: string, updatedData: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask: (taskId: string, columnId: string) => void;
  onMoveTask: (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => void;
};

export function TaskDetailsDialog({
  isOpen,
  onClose,
  task,
  columnId,
  columns,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
}: TaskDetailsDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || '');
      setAssignee(task.assignee || '');
      setStatus(columnId);
    }
  }, [task, columnId, isOpen]);

  const handleSave = () => {
    if (!task || !columnId || !status) return;

    const updatedData: Partial<Omit<Task, 'id'>> = {};
    if (title.trim() !== task.title) updatedData.title = title.trim();
    if (description.trim() !== (task.description || '')) updatedData.description = description.trim();
    if (assignee.trim() !== (task.assignee || '')) updatedData.assignee = assignee.trim();

    if (Object.keys(updatedData).length > 0) {
      onUpdateTask(task.id, columnId, updatedData);
    }

    if (status !== columnId) {
      const destinationColumn = columns.find(c => c.id === status);
      const toIndex = destinationColumn ? destinationColumn.tasks.length : 0;
      onMoveTask(task.id, columnId, status, toIndex);
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (!task || !columnId) return;
    onDeleteTask(task.id, columnId);
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assignee</Label>
                <Input
                  id="task-assignee"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Enter assignee's name"
                />
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
          <DialogFooter className="justify-between sm:justify-between">
            <Button variant="ghost" size="default" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 text-destructive" /> Delete Task
              <span className="sr-only">Delete Task</span>
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" onClick={handleSave}>Save Changes</Button>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
