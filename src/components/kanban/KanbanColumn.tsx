'use client';

import { useState, useRef, useMemo, memo, useCallback } from 'react';
import type { Column, KanbanUser, Task, Project } from '@/types/kanban';
import { KanbanTaskCard } from './KanbanTaskCard';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewTaskDialog } from './NewTaskDialog';
import { cn } from '@/lib/utils';
import { useKanbanStore } from '@/hooks/use-kanban-store';
import { Input } from '@/components/ui/input';
import { Separator } from '../ui/separator';
import { MAX_COLUMN_TITLE_LENGTH, PRIORITY_ORDER } from '@/lib/constants';

type KanbanColumnProps = {
  project: Project;
  column: Omit<Column, 'tasks'>;
  tasks: Task[];
  allTasks: Task[];
  members: KanbanUser[];
  onColumnDragStart: (columnId: string) => void;
  onColumnDrop: (targetColumnId: string) => void;
  onColumnDragEnd: () => void;
  draggedColumnId: string | null;
  onTaskClick: (task: Task, columnId: string) => void;
};

const getPriority = (task: Task) => PRIORITY_ORDER[task.priority ?? 'Medium'] ?? 2;

export const KanbanColumn = memo(function KanbanColumn({
  project,
  column,
  tasks,
  allTasks,
  members,
  onColumnDragStart,
  onColumnDrop,
  onColumnDragEnd,
  draggedColumnId,
  onTaskClick,
}: KanbanColumnProps) {
  const actions = useKanbanStore((state) => state.actions);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isTaskDragOver, setIsTaskDragOver] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const isDraggingThisColumn = draggedColumnId === column.id;
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const enableDeadlines = useMemo(() => project.enableDeadlines ?? true, [project.enableDeadlines]);
  const enableLabels = useMemo(() => project.enableLabels ?? true, [project.enableLabels]);
  const projectLabels = useMemo(() => project.labels ?? [], [project.labels]);

  const finalColumnTitle = useMemo(() => {
    return project.columns.find((c) => c.title.toLowerCase() === 'done')?.title;
  }, [project.columns]);

  const isDoneColumn = column.title === finalColumnTitle;

  const parentTasks = useMemo(() => tasks.filter((task) => !task.parentId), [tasks]);

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

  const tasksWithDeadline = useMemo(
    () => (enableDeadlines ? sortedTasks.filter((t) => !!t.deadline) : []),
    [sortedTasks, enableDeadlines],
  );
  const tasksWithoutDeadline = useMemo(
    () => (enableDeadlines ? sortedTasks.filter((t) => !t.deadline) : sortedTasks),
    [sortedTasks, enableDeadlines],
  );

  const handleTitleBlur = useCallback(async () => {
    if (isDoneColumn) {
      setIsEditingTitle(false);
      setTitle(column.title);
      return;
    }
    if (title.trim() && title.trim() !== column.title) {
      await actions.updateColumnTitle(project.id, column.id, title.trim());
    } else {
      setTitle(column.title);
    }
    setIsEditingTitle(false);
  }, [actions, column.id, column.title, isDoneColumn, project.id, title]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
      } else if (e.key === 'Escape') {
        setTitle(column.title);
        setIsEditingTitle(false);
      }
    },
    [column.title],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
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

          actions.moveTask(project.id, taskId, fromColumnId, column.id, targetIndex);
        }
      } catch (error) {
        console.error('Failed to parse task data:', error);
      }
    },
    [actions, column.id, onColumnDrop, project.id],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
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
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!columnRef.current?.contains(e.relatedTarget as Node)) {
      setIsTaskDragOver(false);
    }
  }, []);

  const handleTaskClick = useCallback(
    (task: Task) => {
      onTaskClick(task, column.id);
    },
    [column.id, onTaskClick],
  );

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
          onClick={handleTaskClick}
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
            maxLength={MAX_COLUMN_TITLE_LENGTH}
          />
        ) : (
          <h3
            onClick={() => !isDoneColumn && setIsEditingTitle(true)}
            className={cn(
              'font-headline font-semibold text-lg w-full p-1 -m-1 rounded truncate',
              !isDoneColumn ? 'cursor-text md:hover:bg-muted/50' : 'cursor-default',
            )}
            title={column.title}
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
        project={project}
        columnId={column.id}
        members={members}
      />
    </div>
  );
});
