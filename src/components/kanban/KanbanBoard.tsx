'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import type { Project, Task, KanbanUser } from '@/types/kanban';
import { KanbanColumn } from './KanbanColumn';
import { NewColumnDialog } from './NewColumnDialog';
import { useKanbanStore } from '@/hooks/use-kanban-store';
import Confetti from 'react-confetti';

type KanbanBoardProps = {
  project: Project;
  onTaskClick: (task: Task, columnId: string) => void;
};

export function KanbanBoard({ project, onTaskClick }: KanbanBoardProps) {
  const actions = useKanbanStore((state) => state.actions);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [members, setMembers] = useState<KanbanUser[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const prevProjectRef = useRef<Project>();

  const allTasks = useMemo(() => project.columns.flatMap((c) => c.tasks), [project.columns]);
  const enableDeadlines = useMemo(() => project.enableDeadlines ?? true, [project.enableDeadlines]);
  const enableLabels = useMemo(() => project.enableLabels ?? true, [project.enableLabels]);
  const projectLabels = useMemo(() => project.labels ?? [], [project.labels]);

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
    const prevProject = prevProjectRef.current;

    if (prevProject && project) {
      const doneColumn = project.columns.find((c) => c.title === 'Done');
      if (doneColumn) {
        const prevDoneColumn = prevProject.columns.find((c) => c.id === doneColumn.id);
        if (prevDoneColumn && doneColumn.tasks.length > prevDoneColumn.tasks.length) {
          const prevTaskIds = new Set(prevDoneColumn.tasks.map((t) => t.id));
          const newTaskInDone = doneColumn.tasks.find((t) => !prevTaskIds.has(t.id));
          if (newTaskInDone) {
            setShowConfetti(true);
          }
        }
      }
    }

    prevProjectRef.current = project;
  }, [project]);

  useEffect(() => {
    if (project.id) {
      actions.getProjectMembers(project.id).then(setMembers);
    }
  }, [project.id, actions]);

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

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}
      <div className="w-full sm:flex-1 sm:w-auto p-2 sm:p-4 md:p-6 flex flex-col sm:flex-row gap-4 overflow-x-auto max-w-screen min-w-0 min-h-0 h-full max-h-screen">
        {project.columns.map((column) => (
          <KanbanColumn
            key={column.id}
            projectId={project.id}
            column={column}
            allTasks={allTasks}
            members={members}
            projectLabels={projectLabels}
            enableDeadlines={enableDeadlines}
            enableLabels={enableLabels}
            onColumnDragStart={handleColumnDragStart}
            onColumnDrop={handleColumnDrop}
            onColumnDragEnd={handleColumnDragEnd}
            draggedColumnId={draggedColumnId}
            onTaskClick={onTaskClick}
          />
        ))}
        <div className="flex-shrink-0 w-full sm:w-72 md:w-80 max-w-full min-w-0 min-h-[100px] h-auto flex flex-col rounded-lg bg-card/50 transition-all sm:h-full sm:max-h-screen sm:flex-grow">
          <NewColumnDialog projectId={project.id} />
        </div>
      </div>
    </>
  );
}
