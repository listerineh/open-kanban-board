"use client";

import type { KanbanUser, Task, Label } from "@/types/kanban";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, Calendar, CheckCircle2, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Progress } from "../ui/progress";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "../ui/badge";

type KanbanTaskCardProps = {
  task: Task;
  subtasks: Task[];
  columnId: string;
  members: KanbanUser[];
  projectLabels: Label[];
  enableDeadlines: boolean;
  enableLabels: boolean;
  onDragStart: (task: Task, fromColumnId: string) => void;
  onDragEnd: () => void;
  onClick: () => void;
};

export function KanbanTaskCard({
  task,
  subtasks,
  columnId,
  members,
  projectLabels,
  enableDeadlines,
  enableLabels,
  onDragStart,
  onDragEnd,
  onClick,
}: KanbanTaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isOverdue, setIsOverdue] = useState(false);
  const [deadlineText, setDeadlineText] = useState("");

  const completedSubtasks = subtasks.filter((st) => !!st.completedAt).length;
  const subtaskProgress =
    subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;
  const taskLabels = projectLabels.filter((label) =>
    task.labelIds?.includes(label.id),
  );

  useEffect(() => {
    if (task.completedAt) {
      setProgress(100);
      setDeadlineText("");
      setIsOverdue(false);
      return;
    }

    if (!task.deadline || !enableDeadlines) {
      setProgress(0);
      setIsOverdue(false);
      setDeadlineText("");
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
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ taskId: task.id, fromColumnId: columnId }),
    );
    e.dataTransfer.effectAllowed = "move";
    onDragStart(task, columnId);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  const assignee = members.find((m) => m.uid === task.assignee);

  const priorityStyles: Record<string, string> = {
    Urgent: "border-l-red-500",
    High: "border-l-orange-400",
    Medium: "border-l-blue-400",
    Low: "border-l-zinc-500",
  };

  const priority = task.priority ?? "Medium";
  const borderClass = priorityStyles[priority];

  return (
    <Card
      draggable={!task.parentId}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      data-task-id={task.id}
      className={cn(
        "group cursor-pointer active:cursor-grabbing bg-card md:hover:bg-card/80 transition-all border-l-4",
        isDragging && "opacity-50",
        task.completedAt ? "border-l-green-500" : borderClass,
        task.parentId && "opacity-80 md:hover:opacity-100",
      )}
    >
      <CardContent className="p-3 flex items-start gap-2">
        <GripVertical className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0 group-hover:text-foreground" />
        <div className="flex-grow space-y-2">
          <div>
            <p className="font-medium">{task.title}</p>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {enableLabels && taskLabels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {taskLabels.map((label) => (
                <Badge
                  key={label.id}
                  variant="secondary"
                  className="text-xs px-1.5 py-0.5"
                  style={{ backgroundColor: label.color, color: "white" }}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex justify-between items-end gap-2 flex-wrap">
            <div className="flex items-center gap-4">
              {assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={assignee.photoURL ?? ""}
                      alt={assignee.displayName ?? "User"}
                    />
                    <AvatarFallback>
                      {assignee.displayName?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {assignee.displayName}
                  </span>
                </div>
              ) : (
                <div />
              )}

              {subtasks.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <ListTodo className="h-3.5 w-3.5" />
                  <span>
                    {completedSubtasks}/{subtasks.length}
                  </span>
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
                      "flex items-center gap-1.5 text-xs",
                      isOverdue ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{deadlineText}</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {task.deadline &&
            task.createdAt &&
            !task.completedAt &&
            subtasks.length === 0 &&
            enableDeadlines && (
              <div className="pt-1">
                <Progress
                  value={progress}
                  className={cn("h-1.5", isOverdue && "[&>div]:bg-destructive")}
                />
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
}
