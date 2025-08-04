'use client';

import type { KanbanUser, Task, Label } from '@/types/kanban';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical, Calendar, CheckCircle2, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';
import { MAX_VISIBLE_AVATARS, PRIORITY_STYLES } from '@/lib/constants';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type KanbanTaskCardProps = {
  task: Task;
  subtasks: Task[];
  columnId: string;
  members: KanbanUser[];
  projectLabels: Label[];
  enableDeadlines: boolean;
  enableLabels: boolean;
  onClick: (task: Task) => void;
};

export const KanbanTaskCard = memo(function KanbanTaskCard({
  task,
  subtasks,
  columnId,
  members,
  projectLabels,
  enableDeadlines,
  enableLabels,
  onClick,
}: KanbanTaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isOverdue, setIsOverdue] = useState(false);
  const [deadlineText, setDeadlineText] = useState('');

  const completedSubtasks = useMemo(() => subtasks.filter((st) => !!st.completedAt).length, [subtasks]);
  const subtaskProgress = useMemo(
    () => (subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0),
    [subtasks, completedSubtasks],
  );
  const taskLabels = useMemo(
    () => projectLabels.filter((label) => task.labelIds?.includes(label.id)),
    [projectLabels, task.labelIds],
  );

  useEffect(() => {
    if (task.completedAt) {
      setProgress(100);
      setDeadlineText('');
      setIsOverdue(false);
      return;
    }

    if (!task.deadline || !enableDeadlines) {
      setProgress(0);
      setIsOverdue(false);
      setDeadlineText('');
      return;
    }

    const deadlineDate = new Date(task.deadline);

    const updateDeadlineInfo = () => {
      const now = new Date();

      setIsOverdue(now > deadlineDate);
      setDeadlineText(formatDistanceToNow(deadlineDate, { addSuffix: true }));

      const startMs = new Date(task.createdAt).getTime();
      const endMs = deadlineDate.getTime();
      const nowMs = now.getTime();

      if (isNaN(startMs) || isNaN(endMs)) {
        setProgress(0);
        return;
      }

      if (nowMs >= endMs) {
        setProgress(100);
        return;
      }

      if (nowMs < startMs) {
        setProgress(0);
        return;
      }

      const totalDuration = endMs - startMs;
      if (totalDuration <= 0) {
        setProgress(100);
        return;
      }

      const elapsedDuration = nowMs - startMs;
      const calculatedProgress = (elapsedDuration / totalDuration) * 100;

      setProgress(calculatedProgress);
    };

    updateDeadlineInfo();
    const intervalId = setInterval(updateDeadlineInfo, 60000);

    return () => clearInterval(intervalId);
  }, [task.createdAt, task.deadline, task.completedAt, enableDeadlines]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (task.parentId) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, fromColumnId: columnId }));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const allParticipantIds = useMemo(() => {
    const ids = new Set(task.assigneeIds || (task.assignee ? [task.assignee] : []));
    subtasks.forEach((st) => {
      (st.assigneeIds || (st.assignee ? [st.assignee] : [])).forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [task.assigneeIds, task.assignee, subtasks]);

  const participants = useMemo(() => {
    return allParticipantIds.map((id) => members.find((m) => m.uid === id)).filter(Boolean) as KanbanUser[];
  }, [allParticipantIds, members]);

  const priority = task.priority ?? 'Medium';
  const borderClass = PRIORITY_STYLES[priority];

  return (
    <Card
      draggable={!task.parentId}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick(task)}
      data-task-id={task.id}
      className={cn(
        'group cursor-pointer active:cursor-grabbing bg-card md:hover:bg-card/80 transition-all border-l-4',
        isDragging && 'opacity-50',
        task.completedAt ? 'border-l-green-500' : borderClass,
        task.parentId && 'opacity-80 md:hover:opacity-100',
      )}
    >
      <CardContent className="p-3 flex items-start gap-2">
        <GripVertical className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0 md:group-hover:text-foreground" />
        <div className="flex-grow space-y-2">
          <div>
            <p className="font-medium">{task.title}</p>
            {task.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
          </div>

          {enableLabels && taskLabels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {taskLabels.map((label) => (
                <Badge
                  key={label.id}
                  variant="secondary"
                  className="text-xs px-1.5 py-0.5"
                  style={{ backgroundColor: label.color, color: 'white' }}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex justify-between items-end gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {subtasks.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <ListTodo className="h-3.5 w-3.5" />
                  <span>
                    {completedSubtasks}/{subtasks.length}
                  </span>
                </div>
              )}
            </div>

            {participants.length > 0 && (
              <div className="flex items-center -space-x-2">
                {participants.slice(0, MAX_VISIBLE_AVATARS).map((p) => (
                  <Tooltip key={p.uid}>
                    <TooltipTrigger>
                      <Avatar className="h-6 w-6 border-2 border-card">
                        <AvatarImage src={p.photoURL ?? ''} alt={p.displayName ?? 'User'} />
                        <AvatarFallback>{p.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{p.displayName}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {participants.length > MAX_VISIBLE_AVATARS && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="h-6 w-6 border-2 border-card">
                        <AvatarFallback>+{participants.length - MAX_VISIBLE_AVATARS}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      {participants.slice(MAX_VISIBLE_AVATARS).map((p) => (
                        <p key={p.uid}>{p.displayName}</p>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>

          {(() => {
            if (task.completedAt) {
              return (
                <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Completed</span>
                </div>
              );
            }
            if (task.deadline && enableDeadlines) {
              return (
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-xs',
                    isOverdue ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{deadlineText}</span>
                </div>
              );
            }
            return null;
          })()}

          {task.deadline && task.createdAt && !task.completedAt && subtasks.length === 0 && enableDeadlines && (
            <div className="pt-1">
              <Progress value={progress} className={cn('h-1.5', isOverdue && '[&>div]:bg-destructive')} />
            </div>
          )}

          {subtasks.length > 0 && !task.completedAt && (
            <div className="pt-1">
              <Progress value={subtaskProgress} className="h-1.5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
