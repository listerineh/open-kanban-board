"use client";

import { useState, useRef } from 'react';
import type { Column, Task } from '@/types/kanban';
import { KanbanTaskCard } from './KanbanTaskCard';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewTaskDialog } from './NewTaskDialog';
import { cn } from '@/lib/utils';
import type { KanbanStore } from '@/hooks/use-kanban-store';
import { Input } from '@/components/ui/input';

type KanbanColumnProps = {
  column: Column;
  store: KanbanStore;
  onTaskDragStart: (task: Task, fromColumnId: string) => void;
  onTaskDragEnd: () => void;
  onColumnDragStart: (columnId: string) => void;
  onColumnDrop: (targetColumnId: string) => void;
  onColumnDragEnd: () => void;
  draggedColumnId: string | null;
};

export function KanbanColumn({ column, store, onTaskDragStart, onTaskDragEnd, onColumnDragStart, onColumnDrop, onColumnDragEnd, draggedColumnId }: KanbanColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isTaskDragOver, setIsTaskDragOver] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const isDraggingThisColumn = draggedColumnId === column.id;

  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== column.title) {
      store.updateColumnTitle(column.id, title.trim());
    } else {
      setTitle(column.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setTitle(column.title);
      setIsEditingTitle(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsTaskDragOver(false);

    const draggedColId = e.dataTransfer.getData('application/kanban-column');
    if (draggedColId) {
      onColumnDrop(column.id);
      return;
    }
    
    const taskData = e.dataTransfer.getData('application/json');
    if (!taskData) return;

    const { taskId, fromColumnId } = JSON.parse(taskData);

    const cards = Array.from(columnRef.current?.querySelectorAll('[data-task-id]') || []);
    const dropY = e.clientY;
    
    let targetIndex = cards.length;

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement;
        const { top, height } = card.getBoundingClientRect();
        if (dropY < top + height / 2) {
            targetIndex = i;
            break;
        }
    }
    
    if (fromColumnId === column.id) {
        const originalIndex = column.tasks.findIndex(t => t.id === taskId);
        if (originalIndex !== -1 && originalIndex < targetIndex) {
            targetIndex--;
        }
    }
    
    store.moveTask(taskId, fromColumnId, column.id, targetIndex);
    onTaskDragEnd();
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('application/json')) {
      setIsTaskDragOver(true);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!columnRef.current?.contains(e.relatedTarget as Node)) {
        setIsTaskDragOver(false);
    }
  };

  return (
    <div
      ref={columnRef}
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/kanban-column', column.id);
        e.dataTransfer.effectAllowed = 'move';
        onColumnDragStart(column.id);
      }}
      onDragEnd={onColumnDragEnd}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "flex-shrink-0 w-72 md:w-80 h-full flex flex-col rounded-lg bg-card/50 transition-all",
        isTaskDragOver && !draggedColumnId && "bg-primary/10",
        isDraggingThisColumn && "opacity-50 ring-2 ring-primary ring-offset-2 ring-offset-background",
        draggedColumnId && !isDraggingThisColumn && "hover:ring-2 hover:ring-primary/50"
      )}
    >
      <div className="p-3 border-b border-border flex justify-between items-center gap-2 cursor-grab active:cursor-grabbing">
        {isEditingTitle ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="h-8 border-transparent focus-visible:border-input focus-visible:ring-ring focus-visible:ring-1 bg-transparent text-lg font-headline font-semibold p-1 -m-1 w-full"
          />
        ) : (
          <h3
            onClick={() => setIsEditingTitle(true)}
            className="font-headline font-semibold text-lg cursor-pointer p-1 -m-1 rounded hover:bg-muted/50 w-full"
          >
            {column.title}
          </h3>
        )}
        <span className="text-sm text-muted-foreground">{column.tasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {column.tasks.map((task) => (
          <KanbanTaskCard 
            key={task.id} 
            task={task} 
            columnId={column.id} 
            onDragStart={onTaskDragStart}
            onDragEnd={onTaskDragEnd}
          />
        ))}
        {isTaskDragOver && <div className="h-16 rounded-lg bg-primary/20 border-2 border-dashed border-primary"></div>}
      </div>
      <div className="p-3 mt-auto">
        <Button variant="ghost" className="w-full justify-start" onClick={() => setIsAddingTask(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      </div>
      <NewTaskDialog
        isOpen={isAddingTask}
        onClose={() => setIsAddingTask(false)}
        onAddTask={(taskData) => store.addTask(column.id, taskData)}
      />
    </div>
  );
}
