"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar as CalendarIcon,
  Check,
  Plus,
  Trash2,
  ListTodo,
  CheckCircle2,
  Minus,
} from "lucide-react";
import type { Task, Column, KanbanUser } from "@/types/kanban";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { format, setHours, setMinutes, isPast, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { useToast } from "@/hooks/use-toast";

type TaskDetailsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  task: Task | null;
  columnId: string | null;
  columns: Column[];
  allTasks: Task[];
  members: KanbanUser[];
  onUpdateTask: (
    projectId: string,
    taskId: string,
    columnId: string,
    updatedData: Partial<Omit<Task, "id">>,
  ) => Promise<void>;
  onDeleteTask: (
    projectId: string,
    taskId: string,
    columnId: string,
  ) => Promise<void>;
  onMoveTask: (
    projectId: string,
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
    toIndex: number,
  ) => Promise<void>;
  onAddTask: (
    projectId: string,
    columnId: string,
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt">,
  ) => Promise<void>;
  onTaskClick: (task: Task, columnId: string) => void;
};

export function TaskDetailsDialog({
  isOpen,
  onClose,
  projectId,
  task,
  columnId,
  columns,
  allTasks,
  members,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
  onAddTask,
  onTaskClick,
}: TaskDetailsDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const { toast } = useToast();

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );
  const minutes = ["00", "15", "30", "45"];

  const subtasks = useMemo(() => {
    if (!task) return [];
    return allTasks
      .filter((t) => t.parentId === task.id)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }, [allTasks, task]);

  const parentTask = useMemo(() => {
    if (!task?.parentId) return null;
    return allTasks.find((t) => t.id === task.parentId) ?? null;
  }, [allTasks, task]);

  const completedSubtasks = useMemo(
    () => subtasks.filter((st) => !!st.completedAt).length,
    [subtasks],
  );
  const subtaskProgress = useMemo(
    () =>
      subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0,
    [subtasks, completedSubtasks],
  );

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || "");
      setAssigneeId(task.assignee || "unassigned");
      setPriority(task.priority || "Medium");
      const deadlineDate = task.deadline ? new Date(task.deadline) : undefined;
      setDeadline(deadlineDate);
      if (deadlineDate) {
        const hasTime =
          deadlineDate.getHours() !== 0 || deadlineDate.getMinutes() !== 0;
        setTime(hasTime ? format(deadlineDate, "HH:mm") : "");
      } else {
        setTime("");
      }
      setStatus(columnId);
    }
  }, [task, columnId, isOpen]);

  const handleDateSelect = (date: Date | undefined) => {
    if (
      parentTask?.deadline &&
      date &&
      isAfter(date, new Date(parentTask.deadline))
    ) {
      toast({
        variant: "destructive",
        title: "Invalid Deadline",
        description: `Sub-task deadline cannot be after the parent task's deadline of ${format(new Date(parentTask.deadline), "PPP")}.`,
      });
      return;
    }
    setDeadline(date);
    if (!date) {
      setTime("");
    }
  };

  const handleSave = async () => {
    if (!task || !columnId || !status || isSaving) return;

    setIsSaving(true);

    let finalDeadline = deadline;
    if (finalDeadline && time) {
      const [hours, minutes] = time.split(":");
      finalDeadline = setMinutes(
        setHours(finalDeadline, parseInt(hours, 10)),
        parseInt(minutes, 10),
      );
    } else if (finalDeadline) {
      finalDeadline.setHours(0, 0, 0, 0);
    }
    const finalDeadlineISO = finalDeadline?.toISOString();

    const updatedData: Partial<Omit<Task, "id">> = {};
    const finalAssigneeId = assigneeId === "unassigned" ? "" : assigneeId;

    if (title.trim() !== task.title) updatedData.title = title.trim();
    if (description.trim() !== (task.description || ""))
      updatedData.description = description.trim();
    if (finalAssigneeId !== (task.assignee || ""))
      updatedData.assignee = finalAssigneeId;
    if (priority !== (task.priority || "Medium"))
      updatedData.priority = priority;
    if ((finalDeadlineISO || undefined) !== (task.deadline || undefined))
      updatedData.deadline = finalDeadlineISO;

    const updatePromise =
      Object.keys(updatedData).length > 0
        ? onUpdateTask(projectId, task.id, columnId, updatedData)
        : Promise.resolve();

    const movePromise =
      status !== columnId && !task.parentId
        ? () => {
            const destinationColumn = columns.find((c) => c.id === status);
            const toIndex = destinationColumn
              ? destinationColumn.tasks.length
              : 0;
            return onMoveTask(projectId, task.id, columnId, status, toIndex);
          }
        : () => Promise.resolve();

    await updatePromise;
    await movePromise();

    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!task || !columnId) return;
    await onDeleteTask(projectId, task.id, columnId);
    setIsDeleteDialogOpen(false);
    onClose();
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !task || !columnId) return;
    const subtaskData = {
      title: newSubtaskTitle.trim(),
      parentId: task.id,
      priority: "Medium",
    };
    await onAddTask(projectId, columnId, subtaskData);
    setNewSubtaskTitle("");
  };

  const handleSubtaskCheck = async (subtaskId: string, isChecked: boolean) => {
    if (!task || !columnId) return;
    const updatedData = {
      completedAt: isChecked ? new Date().toISOString() : null,
    };
    await onUpdateTask(projectId, subtaskId, columnId, updatedData as any);
  };

  const handleSubtaskClick = (subtask: Task) => {
    if (!columnId) return;
    onTaskClick(subtask, columnId);
  };

  const [currentHour, currentMinute] = time.split(":");

  const handleHourChange = (newHour: string) => {
    setTime(`${newHour}:${currentMinute || "00"}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    setTime(`${currentHour || "00"}:${newMinute}`);
  };

  if (!isOpen || !task) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle>
              {task.parentId ? "Edit Sub-task" : "Edit Task"}
            </DialogTitle>
            <DialogDescription>
              Make changes to your task here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 pb-4 flex-grow overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design the landing page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about the task"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select
                  value={priority ?? "Medium"}
                  onValueChange={(value) =>
                    setPriority(value as Task["priority"])
                  }
                >
                  <SelectTrigger id="task-priority">
                    <SelectValue placeholder="Select a priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urgent">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span>Urgent</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="High">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-4 w-4 text-orange-400" />
                        <span>High</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Medium">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-blue-400" />
                        <span>Medium</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Low">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-4 w-4 text-zinc-400" />
                        <span>Low</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-status">Status</Label>
                <Select
                  value={status ?? ""}
                  onValueChange={setStatus}
                  disabled={!!task.parentId}
                >
                  <SelectTrigger id="task-status">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assignee</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger id="task-assignee">
                    <SelectValue placeholder="Select an assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.uid} value={member.uid}>
                        <div className="flex flex-row justify-between items-center gap-2">
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                            <AvatarImage
                              src={member.photoURL ?? ""}
                              alt={member.displayName ?? "User"}
                            />
                            <AvatarFallback>
                              {member.displayName?.charAt(0).toUpperCase() ??
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <p className="sm:text-md text-sm">
                            {member.displayName ?? member.email}
                          </p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadline && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? (
                        format(deadline, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={handleDateSelect}
                      disabled={(date) =>
                        (parentTask?.deadline &&
                          isAfter(date, new Date(parentTask.deadline))) ||
                        false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-1">
                  <Select
                    value={currentHour}
                    onValueChange={handleHourChange}
                    disabled={!deadline}
                  >
                    <SelectTrigger className="w-[75px]">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="font-bold text-muted-foreground">:</span>
                  <Select
                    value={currentMinute}
                    onValueChange={handleMinuteChange}
                    disabled={!deadline}
                  >
                    <SelectTrigger className="w-[75px]">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {!task.parentId && (
              <div className="space-y-4 pt-2">
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ListTodo className="h-4 w-4" /> Sub-tasks
                  </Label>
                  {subtasks.length > 0 && (
                    <div className="space-y-2">
                      <Progress value={subtaskProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {completedSubtasks} of {subtasks.length} sub-tasks
                        completed
                      </p>
                    </div>
                  )}
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                      >
                        <Checkbox
                          id={`subtask-${subtask.id}`}
                          checked={!!subtask.completedAt}
                          onCheckedChange={(checked) =>
                            handleSubtaskCheck(subtask.id, !!checked)
                          }
                        />
                        <div
                          className="flex-grow cursor-pointer"
                          onClick={() => handleSubtaskClick(subtask)}
                        >
                          <label
                            htmlFor={`subtask-${subtask.id}`}
                            className={cn(
                              "text-sm flex-grow",
                              subtask.completedAt &&
                                "line-through text-muted-foreground",
                            )}
                          >
                            {subtask.title}
                          </label>
                          {subtask.deadline && (
                            <p
                              className={cn(
                                "text-xs",
                                subtask.completedAt
                                  ? "text-muted-foreground/80"
                                  : isPast(new Date(subtask.deadline))
                                    ? "text-destructive"
                                    : "text-muted-foreground",
                              )}
                            >
                              {format(new Date(subtask.deadline), "MMM d")}
                            </p>
                          )}
                        </div>
                        {subtask.assignee && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={
                                members.find((m) => m.uid === subtask.assignee)
                                  ?.photoURL ?? ""
                              }
                            />
                            <AvatarFallback>
                              {members
                                .find((m) => m.uid === subtask.assignee)
                                ?.displayName?.charAt(0)
                                .toUpperCase() ?? "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Input
                      placeholder="Add a new sub-task..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                    />
                    <Button onClick={handleAddSubtask} size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="justify-between sm:justify-between p-6 pt-4 border-t flex-shrink-0 gap-2">
            <Button
              variant="destructive"
              size="default"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete task
              <span className="sr-only">Delete Task</span>
            </Button>
            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              task
              {subtasks.length > 0 && " and all of its sub-tasks"} from the
              board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
