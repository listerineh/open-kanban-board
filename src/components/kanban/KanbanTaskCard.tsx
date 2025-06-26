"use client";

import type { Task } from '@/types/kanban';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type KanbanTaskCardProps = {
  task: Task;
  columnId: string;
  onDragStart: (task: Task, fromColumnId: string) => void;
  onDragEnd: () => void;
};

export function KanbanTaskCard({ task, columnId, onDragStart, onDragEnd }: KanbanTaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, fromColumnId: columnId }));
    e.dataTransfer.effectAllowed = "move";
    onDragStart(task, columnId);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    onDragEnd();
    setIsDragging(false);
  };
  
  return (
    <Card 
      draggable 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-task-id={task.id}
      className={cn(
        "group cursor-grab active:cursor-grabbing bg-card hover:bg-card/80 transition-opacity",
        isDragging && "opacity-50"
      )}
    >
      <CardContent className="p-3 flex items-start gap-2">
         <GripVertical className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0 group-hover:text-foreground" />
        <div className="flex-grow">
          <p className="font-medium">{task.title}</p>
          {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
          {task.assignee && (
            <div className="mt-3">
              <Badge variant="secondary">{task.assignee}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
