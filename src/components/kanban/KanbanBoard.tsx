"use client";

import { useState } from 'react';
import type { Project, Task, Column } from '@/types/kanban';
import { KanbanColumn } from './KanbanColumn';
import { NewColumnDialog } from './NewColumnDialog';
import type { KanbanStore } from '@/hooks/use-kanban-store';

type KanbanBoardProps = {
  project: Project;
  store: KanbanStore;
};

export function KanbanBoard({ project, store }: KanbanBoardProps) {
  const [_, setDraggedTask] = useState<{ task: Task; fromColumnId: string } | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

  const handleTaskDragStart = (task: Task, fromColumnId: string) => {
    setDraggedTask({ task, fromColumnId });
  };

  const handleTaskDragEnd = () => {
    setDraggedTask(null);
  };

  const handleColumnDragStart = (columnId: string) => {
    setDraggedColumnId(columnId);
  };
  
  const handleColumnDrop = (targetColumnId: string) => {
    if (draggedColumnId && draggedColumnId !== targetColumnId) {
      store.moveColumn(draggedColumnId, targetColumnId);
    }
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnId(null);
  };
  
  return (
    <div className="flex-1 p-2 sm:p-4 md:p-6 flex gap-4 overflow-x-auto h-full">
      {project.columns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          store={store}
          onTaskDragStart={handleTaskDragStart}
          onTaskDragEnd={handleTaskDragEnd}
          onColumnDragStart={handleColumnDragStart}
          onColumnDrop={handleColumnDrop}
          onColumnDragEnd={handleColumnDragEnd}
          draggedColumnId={draggedColumnId}
        />
      ))}
      <div className="flex-shrink-0 w-72 md:w-80">
        <NewColumnDialog onAddColumn={store.addColumn} />
      </div>
    </div>
  );
}
