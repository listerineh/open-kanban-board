"use client";

import { useEffect, useState, useRef } from 'react';
import type { Project, Task, KanbanUser } from '@/types/kanban';
import { KanbanColumn } from './KanbanColumn';
import { NewColumnDialog } from './NewColumnDialog';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import type { KanbanStore } from '@/hooks/use-kanban-store';
import Confetti from 'react-confetti';

type KanbanBoardProps = {
  project: Project;
  store: KanbanStore;
};

export function KanbanBoard({ project, store }: KanbanBoardProps) {
  const [_, setDraggedTask] = useState<{ task: Task; fromColumnId: string } | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<{ task: Task; columnId: string } | null>(null);
  const [members, setMembers] = useState<KanbanUser[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const prevProjectRef = useRef<Project>();

  useEffect(() => {
    function handleResize() {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const prevProject = prevProjectRef.current;

    if (prevProject && project) {
        const prevCompletedTasks = new Set(prevProject.columns.flatMap(c => c.tasks).filter(t => t.completedAt).map(t => t.id));
        const currentCompletedTasks = project.columns.flatMap(c => c.tasks).filter(t => t.completedAt);

        const newlyCompletedTask = currentCompletedTasks.find(t => !prevCompletedTasks.has(t.id));

        if (newlyCompletedTask) {
            setShowConfetti(true);
        }
    }

    prevProjectRef.current = project;
  }, [project]);

  useEffect(() => {
    if (project.id) {
        store.getProjectMembers(project.id).then(setMembers);
    }
  }, [project.id, store]);

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
    <>
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
      <div className="flex-1 p-2 sm:p-4 md:p-6 flex gap-4 overflow-x-auto h-full">
        {project.columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            store={store}
            members={members}
            onTaskDragStart={handleTaskDragStart}
            onTaskDragEnd={handleTaskDragEnd}
            onColumnDragStart={handleColumnDragStart}
            onColumnDrop={handleColumnDrop}
            onColumnDragEnd={handleColumnDragEnd}
            draggedColumnId={draggedColumnId}
            onTaskClick={(task) => setEditingTask({ task, columnId: column.id })}
          />
        ))}
        <div className="flex-shrink-0 w-72 md:w-80">
          <NewColumnDialog onAddColumn={store.addColumn} />
        </div>
      </div>
      <TaskDetailsDialog
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask?.task ?? null}
        columnId={editingTask?.columnId ?? null}
        columns={project.columns}
        members={members}
        onUpdateTask={store.updateTask}
        onDeleteTask={store.deleteTask}
        onMoveTask={store.moveTask}
      />
    </>
  );
}
