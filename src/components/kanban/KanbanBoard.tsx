'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import type { Project, Task, KanbanUser } from '@/types/kanban';
import { KanbanColumn } from './KanbanColumn';
import { NewColumnDialog } from './NewColumnDialog';
import { useKanbanStore } from '@/hooks/use-kanban-store';
import { useAuth } from '@/hooks/use-auth';
import Confetti from 'react-confetti';

type KanbanBoardProps = {
  project: Project;
  tasks: Task[];
  onTaskClick: (task: Task, columnId: string) => void;
};

export function KanbanBoard({ project, tasks, onTaskClick }: KanbanBoardProps) {
  const { actions, showConfetti } = useKanbanStore();
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [members, setMembers] = useState<KanbanUser[]>([]);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const { user: currentUser } = useAuth();

  useEffect(() => {
    function handleResize() {
      if (typeof window !== 'undefined') {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (project.id) {
      actions.getProjectMembers(project.id).then(setMembers);
    }
  }, [project.id, actions]);

  const isCurrentUserAdmin = useMemo(() => {
    if (!project || !currentUser) return false;
    return project.admins?.includes(currentUser.uid);
  }, [project, currentUser]);

  const handleColumnDragStart = useCallback((columnId: string) => {
    setDraggedColumnId(columnId);
  }, []);

  const handleColumnDrop = useCallback(
    (targetColumnId: string) => {
      if (draggedColumnId && draggedColumnId !== targetColumnId) {
        actions.moveColumn(project.id, draggedColumnId, targetColumnId);
      }
    },
    [actions, draggedColumnId, project.id],
  );

  const handleColumnDragEnd = useCallback(() => {
    setDraggedColumnId(null);
  }, []);

  const tasksByColumn = useMemo(() => {
    return project.columns.reduce(
      (acc, column) => {
        acc[column.id] = tasks.filter((task) => task.columnId === column.id).sort((a, b) => a.order - b.order);
        return acc;
      },
      {} as Record<string, Task[]>,
    );
  }, [project.columns, tasks]);

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          onConfettiComplete={() => actions.hideConfetti()}
        />
      )}
      <div className="w-full sm:flex-1 sm:w-auto p-2 sm:p-4 md:p-6 flex flex-col sm:flex-row gap-4 overflow-x-auto max-w-screen min-w-0 min-h-0 h-full max-h-screen">
        {project.columns.map((column) => (
          <KanbanColumn
            key={column.id}
            project={project}
            column={column}
            tasks={tasksByColumn[column.id] || []}
            allTasks={tasks}
            members={members}
            onColumnDragStart={handleColumnDragStart}
            onColumnDrop={handleColumnDrop}
            onColumnDragEnd={handleColumnDragEnd}
            draggedColumnId={draggedColumnId}
            onTaskClick={onTaskClick}
          />
        ))}
        {isCurrentUserAdmin && (
          <div className="flex-shrink-0 w-full sm:w-72 md:w-80 max-w-full min-w-0 min-h-[100px] h-auto flex flex-col rounded-lg bg-card/50 transition-all sm:h-full sm:max-h-screen sm:flex-grow">
            <NewColumnDialog projectId={project.id} />
          </div>
        )}
      </div>
    </>
  );
}
