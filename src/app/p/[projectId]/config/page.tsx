'use client';

import { useParams, useRouter } from 'next/navigation';
import { useKanbanStore } from '@/hooks/use-kanban-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Search,
  Send,
  Clock,
} from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import type { Project, Column, KanbanUser, Label as LabelType, Invitation } from '@/types/kanban';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FullPageLoader } from '@/components/common/loader';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/auth/user-nav';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import {
  COLOR_SWATCHES,
  MAX_COLUMN_TITLE_LENGTH,
  MAX_LABEL_NAME_LENGTH,
  MAX_PROJECT_DESC_LENGTH,
  MAX_PROJECT_NAME_LENGTH,
  SEARCH_CONSTANTS,
} from '@/lib/constants';
import { Textarea } from '@/components/ui/textarea';

export default function ProjectConfigPage() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };
  const { projects, isLoaded, actions } = useKanbanStore();
  const { toast } = useToast();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [columns, setColumns] = useState<Column[]>([]);
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [members, setMembers] = useState<KanbanUser[]>([]);
  const [pendingMembers, setPendingMembers] = useState<Invitation[]>([]);
  const [inviteSearch, setInviteSearch] = useState('');
  const [searchResults, setSearchResults] = useState<KanbanUser[]>([]);
  const [enableSubtasks, setEnableSubtasks] = useState(true);
  const [enableDeadlines, setEnableDeadlines] = useState(true);
  const [enableLabels, setEnableLabels] = useState(true);
  const [enableDashboard, setEnableDashboard] = useState(true);

  const [columnToDelete, setColumnToDelete] = useState<Column | null>(null);
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState<string>(COLOR_SWATCHES[0]);
  const [editingLabel, setEditingLabel] = useState<LabelType | null>(null);

  const allTasks = useMemo(() => project?.columns.flatMap((c) => c.tasks) ?? [], [project]);

  const hasSubtasks = useMemo(() => allTasks.some((t) => !!t.parentId), [allTasks]);
  const hasDeadlines = useMemo(() => allTasks.some((t) => !!t.deadline), [allTasks]);
  const hasLabels = useMemo(() => allTasks.some((t) => t.labelIds && t.labelIds.length > 0), [allTasks]);

  const isGeneralInfoChanged = useMemo(() => {
    if (!project) return false;
    return projectName.trim() !== project.name || projectDescription.trim() !== (project.description || '');
  }, [project, projectName, projectDescription]);

  useEffect(() => {
    if (authLoading || !isLoaded) {
      return;
    }

    const foundProject = projects.find((p) => p.id === projectId);

    if (foundProject) {
      setProject(foundProject);
      setProjectName(foundProject.name);
      setProjectDescription(foundProject.description || '');
      setColumns(foundProject.columns);
      setLabels(foundProject.labels ?? []);
      setPendingMembers(foundProject.pendingMembers ?? []);
      setEnableSubtasks(foundProject.enableSubtasks ?? true);
      setEnableDeadlines(foundProject.enableDeadlines ?? true);
      setEnableLabels(foundProject.enableLabels ?? true);
      setEnableDashboard(foundProject.enableDashboard ?? true);
      actions.getProjectMembers(projectId).then(setMembers);
    } else {
      router.replace('/404');
    }
  }, [projectId, projects, isLoaded, authLoading, router, actions]);

  const handleSearchUsers = useCallback(
    async (query: string) => {
      setInviteSearch(query);
      if (query.trim().length < SEARCH_CONSTANTS.MIN_QUERY_LENGTH) {
        setSearchResults([]);
        return;
      }
      const results = await actions.searchUsers(query);
      const currentMemberIds = new Set([
        ...members.map((m) => m.uid),
        ...(project?.pendingMembers?.map((pm) => pm.userId) ?? []),
      ]);
      setSearchResults(results.filter((u) => u.uid !== currentUser?.uid && !currentMemberIds.has(u.uid)));
    },
    [actions, members, project, currentUser],
  );

  const handleGeneralChangesSave = async () => {
    if (project && projectName.trim() && isGeneralInfoChanged) {
      await actions.updateProject(project.id, {
        name: projectName.trim(),
        description: projectDescription.trim(),
      });
      toast({ title: 'Success', description: 'Project details updated.' });
    }
  };

  const handleColumnTitleChange = (columnId: string, newTitle: string) => {
    setColumns((currentColumns) => currentColumns.map((c) => (c.id === columnId ? { ...c, title: newTitle } : c)));
  };

  const handleColumnTitleBlur = async (columnId: string, title: string) => {
    const originalColumn = project?.columns.find((c) => c.id === columnId);
    if (title.trim() && title.trim() !== originalColumn?.title) {
      await actions.updateColumnTitle(projectId, columnId, title.trim());
    } else if (originalColumn) {
      setColumns((current) => current.map((c) => (c.id === columnId ? originalColumn : c)));
    }
  };

  const handleDeleteColumn = (column: Column) => {
    if (column.tasks.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot delete column',
        description: 'Please move or delete all tasks from this column first.',
      });
      return;
    }
    setColumnToDelete(column);
  };

  const confirmDeleteColumn = async () => {
    if (columnToDelete) {
      await actions.deleteColumn(projectId, columnToDelete.id);
      setColumnToDelete(null);
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (project) {
      await actions.deleteProject(project.id);
      router.push('/');
    }
    setIsDeleteProjectDialogOpen(false);
  };

  const handleInviteUser = async (userToInvite: KanbanUser) => {
    if (!project) return;
    const { success, message } = await actions.inviteUserToProject(project.id, userToInvite);
    toast({ title: success ? 'Success' : 'Error', description: message, variant: success ? 'default' : 'destructive' });
    if (success) {
      setInviteSearch('');
      setSearchResults([]);
    }
  };

  const handleCancelInvitation = async (userId: string) => {
    if (!project) return;
    await actions.cancelInvitation(project.id, userId);
    toast({ title: 'Success', description: 'Invitation cancelled.' });
  };

  const handleRemoveUser = async (userId: string) => {
    if (!project) return;
    await actions.removeUserFromProject(project.id, userId);
    toast({ title: 'Success', description: 'User removed from project.' });
    actions.getProjectMembers(projectId).then(setMembers);
  };

  const handleSubtaskToggle = async (checked: boolean) => {
    if (!project) return;
    setEnableSubtasks(checked);
    await actions.updateProject(project.id, { enableSubtasks: checked });
    toast({
      title: 'Success',
      description: `Sub-tasks have been ${checked ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleDeadlineToggle = async (checked: boolean) => {
    if (!project) return;
    setEnableDeadlines(checked);
    await actions.updateProject(project.id, { enableDeadlines: checked });
    toast({
      title: 'Success',
      description: `Deadlines have been ${checked ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleLabelToggle = async (checked: boolean) => {
    if (!project) return;
    setEnableLabels(checked);
    await actions.updateProject(project.id, { enableLabels: checked });
    toast({
      title: 'Success',
      description: `Labels have been ${checked ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleDashboardToggle = async (checked: boolean) => {
    if (!project) return;
    setEnableDashboard(checked);
    await actions.updateProject(project.id, { enableDashboard: checked });
    toast({
      title: 'Success',
      description: `Dashboard has been ${checked ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleAddLabel = async () => {
    if (!newLabelName.trim() || !project) return;
    await actions.createLabel(project.id, newLabelName, newLabelColor);
    setNewLabelName('');
    setNewLabelColor(COLOR_SWATCHES[0]);
  };

  const handleUpdateLabel = async () => {
    if (!editingLabel || !editingLabel.name.trim() || !project) return;
    await actions.updateLabel(project.id, editingLabel.id, editingLabel.name, editingLabel.color);
    setEditingLabel(null);
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (!project) return;
    await actions.deleteLabel(project.id, labelId);
  };

  const isOwner = project && currentUser && project.ownerId === currentUser.uid;

  if (authLoading || !isLoaded || !project) {
    return <FullPageLoader text="Loading project settings..." />;
  }

  return (
    <div className="h-dvh bg-background text-foreground overflow-y-auto">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push(`/p/${projectId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-headline">Project Settings</h1>
              <p className="text-muted-foreground">Manage your project details and members.</p>
            </div>
          </div>
          <UserNav />
        </header>

        <main className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Update your project's name and description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGeneralChangesSave()}
                  disabled={!isOwner}
                  maxLength={MAX_PROJECT_NAME_LENGTH}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {projectName.length} / {MAX_PROJECT_NAME_LENGTH}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Project Description</Label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4">
                  <Textarea
                    id="projectDescription"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Add a short description for your project..."
                    disabled={!isOwner}
                    rows={3}
                    maxLength={MAX_PROJECT_DESC_LENGTH}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {projectDescription.length} / {MAX_PROJECT_DESC_LENGTH}
                  </p>
                </div>
                {isOwner && (
                  <div className="flex justify-end">
                    <Button onClick={handleGeneralChangesSave} disabled={!isGeneralInfoChanged}>
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Enable or disable features for this project.</CardDescription>
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
                        ? 'This project has sub-tasks. You must remove them before disabling this feature.'
                        : 'Allow tasks to be broken down into smaller items.'}
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
                        ? 'This project has deadlines. You must remove them before disabling this feature.'
                        : 'Allow tasks to have deadlines.'}
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
                        ? 'This project has labels. You must remove them from all tasks before disabling this feature.'
                        : 'Allow tasks to have labels for categorization.'}
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
                    <p className="text-xs text-muted-foreground">View analytics and charts for this project.</p>
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
                <CardDescription>Create, edit, or delete labels for organizing tasks in this project.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isOwner && (
                  <div className="flex items-center gap-2 p-1 border rounded-lg">
                    <Input
                      placeholder="New label name..."
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="flex-grow bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                      maxLength={MAX_LABEL_NAME_LENGTH}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="w-8 h-8 flex-shrink-0">
                          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: newLabelColor }}></div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-4 gap-2">
                          {COLOR_SWATCHES.map((color) => (
                            <Button
                              key={color}
                              variant="outline"
                              size="icon"
                              className="w-7 h-7"
                              onClick={() => setNewLabelColor(color)}
                            >
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
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
                    <div key={label.id} className="flex items-center gap-2 p-2 px-3 rounded-md border">
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
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateLabel()}
                            maxLength={MAX_LABEL_NAME_LENGTH}
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="icon" className="w-8 h-8 flex-shrink-0">
                                <Palette className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                              <div className="grid grid-cols-4 gap-2">
                                {COLOR_SWATCHES.map((color) => (
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
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                                    {editingLabel.color === color && (
                                      <Check className="w-3 h-3 text-white mix-blend-difference absolute" />
                                    )}
                                  </Button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button size="icon" className="h-8 w-8" onClick={handleUpdateLabel}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingLabel(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: label.color }}></div>
                          <span className="flex-grow font-medium text-sm">{label.name}</span>
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
              <CardDescription>Rename or delete columns for this project's board.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {columns.map((column) => {
                const isDoneColumn = column.title === 'Done';
                return (
                  <div key={column.id} className="flex items-center gap-2 p-2 rounded-md border bg-card/50">
                    <Input
                      value={column.title}
                      onChange={(e) => handleColumnTitleChange(column.id, e.target.value)}
                      onBlur={(e) => handleColumnTitleBlur(column.id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      className="flex-grow bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-ring"
                      disabled={!isOwner || isDoneColumn}
                      maxLength={MAX_COLUMN_TITLE_LENGTH}
                    />
                    {isOwner && !isDoneColumn && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteColumn(column)}>
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
              <CardDescription>Invite, remove, or manage project members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isOwner && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Find user by name or email..."
                    value={inviteSearch}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    className="pl-10"
                  />
                  {searchResults.length > 0 && (
                    <Card className="absolute z-10 w-full mt-2 max-h-60 overflow-y-auto">
                      <CardContent className="p-2">
                        {searchResults.map((user) => (
                          <div
                            key={user.uid}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.photoURL ?? ''} />
                                <AvatarFallback>{user.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{user.displayName}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </div>
                            <Button size="sm" onClick={() => handleInviteUser(user)} className="flex-shrink-0">
                              <Send className="h-4 w-4 mr-2" /> Invite
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Project Members ({members.length})</h4>
                {members.map((member) => (
                  <div key={member.uid} className="flex items-center justify-between p-2 rounded-md border">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={member.photoURL ?? ''} alt={member.displayName ?? 'User'} />
                        <AvatarFallback>{member.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{member.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                    {project.ownerId === member.uid ? (
                      <span className="text-xs text-muted-foreground font-semibold">OWNER</span>
                    ) : (
                      isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUser(member.uid)}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )
                    )}
                  </div>
                ))}
              </div>
              {isOwner && pendingMembers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Pending Invitations ({pendingMembers.length})</h4>
                  {pendingMembers.map((invite) => (
                    <div key={invite.userId} className="flex items-center justify-between p-2 rounded-md border">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={invite.photoURL ?? ''} />
                          <AvatarFallback>{invite.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{invite.displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">{invite.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(invite.invitedAt), { addSuffix: true })}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancelInvitation(invite.userId)}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {isOwner && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>This action is permanent and cannot be undone.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => setIsDeleteProjectDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete this project
                </Button>
              </CardContent>
            </Card>
          )}
        </main>

        <AlertDialog open={!!columnToDelete} onOpenChange={(isOpen) => !isOpen && setColumnToDelete(null)}>
          <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the "{columnToDelete?.title}" column. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setColumnToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteColumn} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isDeleteProjectDialogOpen} onOpenChange={setIsDeleteProjectDialogOpen}>
          <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the <strong>{project?.name}</strong> project,
                including all of its columns and tasks.
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
