'use client';

import { useState, useRef, useMemo } from 'react';
import type { Column, KanbanUser, Task, Label } from '@/types/kanban';
import { KanbanTaskCard } from './KanbanTaskCard';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewTaskDialog } from './NewTaskDialog';
import { cn } from '@/lib/utils';
import type { KanbanStore } from '@/hooks/use-kanban-store';
import { Input } from '@/components/ui/input';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';

type KanbanColumnProps = {
  projectId: string;
  column: Column;
  allTasks: Task[];
  store: KanbanStore;
  members: KanbanUser[];
  projectLabels: Label[];
  enableDeadlines: boolean;
  enableLabels: boolean;
  onTaskDragStart: (task: Task, fromColumnId: string) => void;
  onTaskDragEnd: () => void;
  onColumnDragStart: (columnId: string) => void;
  onColumnDrop: (targetColumnId: string) => void;
  onColumnDragEnd: () => void;
  draggedColumnId: string | null;
  onTaskClick: (task: Task) => void;
};

export function KanbanColumn({
  projectId,
  column,
  allTasks,
  store,
  members,
  projectLabels,
  enableDeadlines,
  enableLabels,
  onTaskDragStart,
  onTaskDragEnd,
  onColumnDragStart,
  onColumnDrop,
  onColumnDragEnd,
  draggedColumnId,
  onTaskClick,
}: KanbanColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isTaskDragOver, setIsTaskDragOver] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const isDraggingThisColumn = draggedColumnId === column.id;
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();

  const isDoneColumn = column.title === 'Done';

  const priorityOrder: Record<Task['priority'] & string, number> = {
    Urgent: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  const getPriority = (task: Task) => priorityOrder[task.priority ?? 'Medium'] ?? 2;

  const parentTasks = useMemo(() => column.tasks.filter((task) => !task.parentId), [column.tasks]);

  const sortedTasks = useMemo(() => {
    return [...parentTasks].sort((a, b) => {
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      if (sortOrder === 'desc') {
        return priorityB - priorityA;
      } else {
        return priorityA - priorityB;
      }
    });
  }, [parentTasks, sortOrder]);

  const tasksWithDeadline = sortedTasks.filter((t) => !!t.deadline);
  const tasksWithoutDeadline = sortedTasks.filter((t) => !t.deadline);

  const handleTitleBlur = async () => {
    if (isDoneColumn) {
      setIsEditingTitle(false);
      setTitle(column.title);
      return;
    }
    if (title.trim() && title.trim() !== column.title) {
      await store.updateColumnTitle(projectId, column.id, title.trim());
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
    if (draggedColId && draggedColId !== column.id) {
      onColumnDrop(column.id);
      return;
    }

    const taskDataString = e.dataTransfer.getData('application/json');
    if (!taskDataString) return;

    try {
      const { taskId, fromColumnId } = JSON.parse(taskDataString);

      if (taskId && fromColumnId && fromColumnId !== column.id) {
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

        store.moveTask(projectId, taskId, fromColumnId, column.id, targetIndex);
      }
    } catch (error) {
      console.error('Failed to parse task data:', error);
    } finally {
      onTaskDragEnd();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.dataTransfer.types.includes('application/kanban-column')) {
      e.dataTransfer.dropEffect = 'move';
      return;
    }

    if (e.dataTransfer.types.includes('application/json')) {
      setIsTaskDragOver(true);
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!columnRef.current?.contains(e.relatedTarget as Node)) {
      setIsTaskDragOver(false);
    }
  };

  const renderTaskList = (tasks: Task[]) => (
    <>
      {tasks.map((task) => (
        <KanbanTaskCard
          key={task.id}
          task={task}
          subtasks={allTasks.filter((t) => t.parentId === task.id)}
          columnId={column.id}
          members={members}
          projectLabels={projectLabels}
          enableDeadlines={enableDeadlines}
          enableLabels={enableLabels}
          onDragStart={onTaskDragStart}
          onDragEnd={onTaskDragEnd}
          onClick={() => onTaskClick(task)}
        />
      ))}
    </>
  );

  const displayTasksWithDeadline = enableDeadlines && tasksWithDeadline.length > 0;
  const displayTasksWithoutDeadline = tasksWithoutDeadline.length > 0;

  return (
    <div
      ref={columnRef}
      draggable={!isDoneColumn}
      onDragStart={(e) => {
        if (e.target !== columnRef.current) {
          return;
        }
        if (isDoneColumn) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData('application/kanban-column', column.id);
        e.dataTransfer.effectAllowed = 'move';
        onColumnDragStart(column.id);
      }}
      onDragEnd={onColumnDragEnd}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'flex-shrink-0 w-full sm:w-72 md:w-80 max-w-full min-w-0 min-h-[200px] h-auto flex flex-col rounded-lg bg-card/50 transition-all sm:h-full sm:max-h-screen sm:flex-grow',
        isTaskDragOver && !draggedColumnId && 'bg-primary/10',
        isDraggingThisColumn && 'opacity-50 ring-2 ring-primary ring-offset-2 ring-offset-background',
        draggedColumnId && !isDraggingThisColumn && 'md:hover:ring-2 md:hover:ring-primary/50',
      )}
    >
      <div
        className={cn(
          'p-3 border-b border-border flex justify-between items-center gap-2',
          !isDoneColumn && 'cursor-grab active:cursor-grabbing',
        )}
      >
        {isEditingTitle ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="h-8 border-transparent focus-visible:border-input focus-visible:ring-ring focus-visible:ring-1 bg-transparent text-lg font-headline font-semibold p-1 -m-1 w-full"
            disabled={isDoneColumn}
          />
        ) : (
          <h3
            onClick={() => !isDoneColumn && setIsEditingTitle(true)}
            className={cn(
              'font-headline font-semibold text-lg w-full p-1 -m-1 rounded',
              !isDoneColumn ? 'cursor-text md:hover:bg-muted/50' : 'cursor-default',
            )}
          >
            {column.title}
          </h3>
        )}
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">{sortedTasks.length}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          >
            {sortOrder === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
            <span className="sr-only">Toggle sort order</span>
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {displayTasksWithDeadline && (
          <div className="space-y-3">
            <div className="px-1 text-xs text-muted-foreground font-semibold">WITH DEADLINE</div>
            {renderTaskList(tasksWithDeadline)}
          </div>
        )}

        {displayTasksWithDeadline && displayTasksWithoutDeadline && <Separator />}

        {displayTasksWithoutDeadline && (
          <div className="space-y-3">
            {displayTasksWithDeadline && (
              <div className="px-1 text-xs text-muted-foreground font-semibold">OTHER TASKS</div>
            )}
            {renderTaskList(tasksWithoutDeadline)}
          </div>
        )}
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
        projectId={projectId}
        columnId={column.id}
        onAddTask={store.addTask}
        members={members}
        projectLabels={projectLabels}
        enableDeadlines={enableDeadlines}
        enableLabels={enableLabels}
      />
    </div>
  );
}
