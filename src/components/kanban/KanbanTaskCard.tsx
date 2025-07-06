"use client";

import type { KanbanUser, Task } from '@/types/kanban';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


type KanbanTaskCardProps = {
  task: Task;
  columnId: string;
  members: KanbanUser[];
  onDragStart: (task: Task, fromColumnId: string) => void;
  onDragEnd: () => void;
  onClick: () => void;
};

export function KanbanTaskCard({ task, columnId, members, onDragStart, onDragEnd, onClick }: KanbanTaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, fromColumnId: columnId }));
    e.dataTransfer.effectAllowed = "move";
    onDragStart(task, columnId);
    setIsDragging(true);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onDragEnd();
    setIsDragging(false);
  };

  const assignee = members.find(m => m.uid === task.assignee);

  const priorityStyles: Record<string, string> = {
    Urgent: 'border-l-red-500',
    High: 'border-l-orange-400',
    Medium: 'border-l-blue-400',
    Low: 'border-l-zinc-500',
  };

  const priority = task.priority ?? 'Medium';
  const borderClass = priorityStyles[priority];
  
  return (
    <Card 
      draggable 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      data-task-id={task.id}
      className={cn(
        "group cursor-pointer active:cursor-grabbing bg-card hover:bg-card/80 transition-all border-l-4",
        isDragging && "opacity-50",
        borderClass
      )}
    >
      <CardContent className="p-3 flex items-start gap-2">
         <GripVertical className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0 group-hover:text-foreground" />
        <div className="flex-grow">
          <p className="font-medium">{task.title}</p>
          {task.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
          {assignee && (
            <div className="mt-3 flex items-center gap-2">
               <Avatar className="h-6 w-6">
                  <AvatarImage src={assignee.photoURL ?? ''} alt={assignee.displayName ?? 'User'} />
                  <AvatarFallback>{assignee.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{assignee.displayName}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
