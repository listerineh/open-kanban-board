"use client";

import { useParams, useRouter } from "next/navigation";
import { useKanbanStore } from "@/hooks/use-kanban-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Trash2,
  X,
  ListTodo,
  CalendarClock,
  Palette,
  Plus,
  Edit,
  Check,
  Tag,
  LayoutDashboard,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  Project,
  Column,
  KanbanUser,
  Label as LabelType,
} from "@/types/kanban";
import { useToast } from "@/hooks/use-toast";
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
import { FullPageLoader } from "@/components/common/loader";
import { useAuth } from "@/hooks/use-auth";
import { UserNav } from "@/components/auth/user-nav";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const colorSwatches = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#78716c",
  "#64748b",
];

export default function ProjectConfigPage() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };
  const store = useKanbanStore();
  const { toast } = useToast();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [columns, setColumns] = useState<Column[]>([]);
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [members, setMembers] = useState<KanbanUser[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [enableSubtasks, setEnableSubtasks] = useState(true);
  const [enableDeadlines, setEnableDeadlines] = useState(true);
  const [enableLabels, setEnableLabels] = useState(true);
  const [enableDashboard, setEnableDashboard] = useState(true);

  const [columnToDelete, setColumnToDelete] = useState<Column | null>(null);
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] =
    useState(false);

  // Label editing state
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(colorSwatches[0]);
  const [editingLabel, setEditingLabel] = useState<LabelType | null>(null);

  const allTasks = useMemo(
    () => project?.columns.flatMap((c) => c.tasks) ?? [],
    [project],
  );

  const hasSubtasks = useMemo(() => {
    return allTasks.some((t) => !!t.parentId);
  }, [allTasks]);

  const hasDeadlines = useMemo(() => {
    return allTasks.some((t) => !!t.deadline);
  }, [allTasks]);

  const hasLabels = useMemo(() => {
    return allTasks.some((t) => t.labelIds && t.labelIds.length > 0);
  }, [allTasks]);

  useEffect(() => {
    if (authLoading || !store.isLoaded) {
      return;
    }

    const foundProject = store.projects.find((p) => p.id === projectId);

    if (foundProject) {
      setProject(foundProject);
      setProjectName(foundProject.name);
      setColumns(foundProject.columns);
      setLabels(foundProject.labels ?? []);
      setEnableSubtasks(foundProject.enableSubtasks ?? true);
      setEnableDeadlines(foundProject.enableDeadlines ?? true);
      setEnableLabels(foundProject.enableLabels ?? true);
      setEnableDashboard(foundProject.enableDashboard ?? true);
      store.getProjectMembers(projectId).then(setMembers);
    } else {
      router.replace("/");
    }
  }, [projectId, store.projects, store.isLoaded, authLoading, router, store]);

  const handleProjectNameSave = async () => {
    if (project && projectName.trim()) {
      await store.updateProject(project.id, { name: projectName.trim() });
      toast({ title: "Success", description: "Project name updated." });
    }
  };

  const handleColumnTitleChange = (columnId: string, newTitle: string) => {
    setColumns((currentColumns) =>
      currentColumns.map((c) =>
        c.id === columnId ? { ...c, title: newTitle } : c,
      ),
    );
  };

  const handleColumnTitleBlur = async (columnId: string, title: string) => {
    const originalColumn = project?.columns.find((c) => c.id === columnId);
    if (title.trim() && title.trim() !== originalColumn?.title) {
      await store.updateColumnTitle(projectId, columnId, title.trim());
    } else if (originalColumn) {
      setColumns((current) =>
        current.map((c) => (c.id === columnId ? originalColumn : c)),
      );
    }
  };

  const handleDeleteColumn = (column: Column) => {
    if (column.tasks.length > 0) {
      toast({
        variant: "destructive",
        title: "Cannot delete column",
        description: "Please move or delete all tasks from this column first.",
      });
      return;
    }
    setColumnToDelete(column);
  };

  const confirmDeleteColumn = async () => {
    if (columnToDelete) {
      await store.deleteColumn(projectId, columnToDelete.id);
      setColumnToDelete(null);
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (project) {
      await store.deleteProject(project.id);
      router.push("/");
    }
    setIsDeleteProjectDialogOpen(false);
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !project) return;
    const { success, message } = await store.inviteUserToProject(
      project.id,
      inviteEmail,
    );
    toast({
      title: success ? "Success" : "Error",
      description: message,
      variant: success ? "default" : "destructive",
    });
    if (success) {
      setInviteEmail("");
      store.getProjectMembers(projectId).then(setMembers);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!project) return;
    await store.removeUserFromProject(project.id, userId);
    toast({ title: "Success", description: "User removed from project." });
    store.getProjectMembers(projectId).then(setMembers);
  };

  const handleSubtaskToggle = async (checked: boolean) => {
    if (!project) return;
    setEnableSubtasks(checked);
    await store.updateProject(project.id, { enableSubtasks: checked });
    toast({
      title: "Success",
      description: `Sub-tasks have been ${checked ? "enabled" : "disabled"}.`,
    });
  };

  const handleDeadlineToggle = async (checked: boolean) => {
    if (!project) return;
    setEnableDeadlines(checked);
    await store.updateProject(project.id, { enableDeadlines: checked });
    toast({
      title: "Success",
      description: `Deadlines have been ${checked ? "enabled" : "disabled"}.`,
    });
  };

  const handleLabelToggle = async (checked: boolean) => {
    if (!project) return;
    setEnableLabels(checked);
    await store.updateProject(project.id, { enableLabels: checked });
    toast({
      title: "Success",
      description: `Labels have been ${checked ? "enabled" : "disabled"}.`,
    });
  };

  const handleDashboardToggle = async (checked: boolean) => {
    if (!project) return;
    setEnableDashboard(checked);
    await store.updateProject(project.id, { enableDashboard: checked });
    toast({
      title: "Success",
      description: `Dashboard has been ${checked ? "enabled" : "disabled"}.`,
    });
  };

  const handleAddLabel = async () => {
    if (!newLabelName.trim() || !project) return;
    await store.createLabel(project.id, newLabelName, newLabelColor);
    setNewLabelName("");
    setNewLabelColor(colorSwatches[0]);
  };

  const handleUpdateLabel = async () => {
    if (!editingLabel || !editingLabel.name.trim() || !project) return;
    await store.updateLabel(
      project.id,
      editingLabel.id,
      editingLabel.name,
      editingLabel.color,
    );
    setEditingLabel(null);
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (!project) return;
    await store.deleteLabel(project.id, labelId);
  };

  const isOwner = project && currentUser && project.ownerId === currentUser.uid;

  if (authLoading || !store.isLoaded || !project) {
    return <FullPageLoader text="Loading project settings..." />;
  }

  return (
    <div className="h-dvh bg-background text-foreground overflow-y-auto">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/p/${projectId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-headline">
                Project Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your project details and members.
              </p>
            </div>
          </div>
          <UserNav />
        </header>

        <main className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Project Name</CardTitle>
              <CardDescription>
                Change the name of your project. This will be visible across the
                application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="max-w-sm"
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleProjectNameSave()
                  }
                  disabled={!isOwner}
                />
                <Button
                  onClick={handleProjectNameSave}
                  className="w-full sm:w-auto"
                  disabled={!isOwner}
                >
                  Save Name
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>
                Enable or disable features for this project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div className="flex items-center gap-3">
                  <ListTodo className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="subtasks-switch" className="font-medium">
                      Enable Sub-tasks
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {hasSubtasks
                        ? "This project has sub-tasks. You must remove them before disabling this feature."
                        : "Allow tasks to be broken down into smaller items."}
                    </p>
                  </div>
                </div>
                <Switch
                  id="subtasks-switch"
                  checked={enableSubtasks}
                  onCheckedChange={handleSubtaskToggle}
                  disabled={!isOwner || hasSubtasks}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="deadlines-switch" className="font-medium">
                      Enable Deadlines
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {hasDeadlines
                        ? "This project has deadlines. You must remove them before disabling this feature."
                        : "Allow tasks to have deadlines."}
                    </p>
                  </div>
                </div>
                <Switch
                  id="deadlines-switch"
                  checked={enableDeadlines}
                  onCheckedChange={handleDeadlineToggle}
                  disabled={!isOwner || hasDeadlines}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="labels-switch" className="font-medium">
                      Enable Labels
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {hasLabels
                        ? "This project has labels. You must remove them from all tasks before disabling this feature."
                        : "Allow tasks to have labels for categorization."}
                    </p>
                  </div>
                </div>
                <Switch
                  id="labels-switch"
                  checked={enableLabels}
                  onCheckedChange={handleLabelToggle}
                  disabled={!isOwner || hasLabels}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="dashboard-switch" className="font-medium">
                      Enable Dashboard
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      View analytics and charts for this project.
                    </p>
                  </div>
                </div>
                <Switch
                  id="dashboard-switch"
                  checked={enableDashboard}
                  onCheckedChange={handleDashboardToggle}
                  disabled={!isOwner}
                />
              </div>
            </CardContent>
          </Card>

          {enableLabels && (
            <Card>
              <CardHeader>
                <CardTitle>Manage Labels</CardTitle>
                <CardDescription>
                  Create, edit, or delete labels for organizing tasks in this
                  project.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isOwner && (
                  <div className="flex items-center gap-2 p-2 border rounded-lg">
                    <Input
                      placeholder="New label name..."
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="flex-grow bg-transparent border-0 focus-visible:ring-1 h-8"
                      onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-8 h-8 flex-shrink-0"
                        >
                          <div
                            className="w-5 h-5 rounded-full"
                            style={{ backgroundColor: newLabelColor }}
                          ></div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-4 gap-2">
                          {colorSwatches.map((color) => (
                            <Button
                              key={color}
                              variant="outline"
                              size="icon"
                              className="w-7 h-7"
                              onClick={() => setNewLabelColor(color)}
                            >
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color }}
                              ></div>
                              {newLabelColor === color && (
                                <Check className="w-3 h-3 text-white mix-blend-difference absolute" />
                              )}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button onClick={handleAddLabel} size="sm">
                      <Plus className="h-4 w-4 mr-1 sm:mr-2" /> Add
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  {labels.map((label) => (
                    <div
                      key={label.id}
                      className="flex items-center gap-2 p-2 px-3 rounded-md border"
                    >
                      {editingLabel?.id === label.id ? (
                        <>
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: editingLabel.color }}
                          ></div>
                          <Input
                            value={editingLabel.name}
                            onChange={(e) =>
                              setEditingLabel({
                                ...editingLabel,
                                name: e.target.value,
                              })
                            }
                            className="flex-grow h-8 bg-transparent"
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleUpdateLabel()
                            }
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="w-8 h-8 flex-shrink-0"
                              >
                                <Palette className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                              <div className="grid grid-cols-4 gap-2">
                                {colorSwatches.map((color) => (
                                  <Button
                                    key={color}
                                    variant="outline"
                                    size="icon"
                                    className="w-7 h-7"
                                    onClick={() =>
                                      setEditingLabel({
                                        ...editingLabel,
                                        color,
                                      })
                                    }
                                  >
                                    <div
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: color }}
                                    ></div>
                                    {editingLabel.color === color && (
                                      <Check className="w-3 h-3 text-white mix-blend-difference absolute" />
                                    )}
                                  </Button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleUpdateLabel}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setEditingLabel(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: label.color }}
                          ></div>
                          <span className="flex-grow font-medium text-sm">
                            {label.name}
                          </span>
                          {isOwner && (
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingLabel({ ...label })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteLabel(label.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Manage Columns</CardTitle>
              <CardDescription>
                Rename or delete columns for this project's board.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {columns.map((column) => {
                const isDoneColumn = column.title === "Done";
                return (
                  <div
                    key={column.id}
                    className="flex items-center gap-2 p-2 rounded-md border bg-card/50"
                  >
                    <Input
                      value={column.title}
                      onChange={(e) =>
                        handleColumnTitleChange(column.id, e.target.value)
                      }
                      onBlur={(e) =>
                        handleColumnTitleBlur(column.id, e.target.value)
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && e.currentTarget.blur()
                      }
                      className="flex-grow bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-ring"
                      disabled={!isOwner || isDoneColumn}
                    />
                    {isOwner && !isDoneColumn && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteColumn(column)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Members</CardTitle>
              <CardDescription>
                Invite or remove members from this project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isOwner && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="max-w-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleInviteUser()}
                  />
                  <Button
                    onClick={handleInviteUser}
                    className="w-full sm:w-auto"
                  >
                    Invite User
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.uid}
                    className="flex items-center justify-between p-2 rounded-md border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={member.photoURL ?? ""}
                          alt={member.displayName ?? "User"}
                        />
                        <AvatarFallback>
                          {member.displayName?.charAt(0).toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    {project.ownerId === member.uid ? (
                      <span className="text-xs text-muted-foreground font-semibold">
                        OWNER
                      </span>
                    ) : (
                      isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUser(member.uid)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {isOwner && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  This action is permanent and cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteProjectDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete this project
                </Button>
              </CardContent>
            </Card>
          )}
        </main>

        <AlertDialog
          open={!!columnToDelete}
          onOpenChange={(isOpen) => !isOpen && setColumnToDelete(null)}
        >
          <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the "{columnToDelete?.title}"
                column. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setColumnToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteColumn}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={isDeleteProjectDialogOpen}
          onOpenChange={setIsDeleteProjectDialogOpen}
        >
          <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the{" "}
                <strong>{project?.name}</strong> project, including all of its
                columns and tasks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteProject}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
