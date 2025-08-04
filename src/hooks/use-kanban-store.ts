'use client';

import { create } from 'zustand';
import type { Project, Column, Task, KanbanUser, Activity, Label, Notification, Invitation } from '@/types/kanban';
import { toast } from './use-toast';
import { db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  arrayUnion,
  arrayRemove,
  limit,
  startAt,
  endAt,
  orderBy,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { subDays, subWeeks, subMonths } from 'date-fns';

export type AddProjectOptions = {
  name: string;
  description?: string;
  template: 'default' | 'dev' | 'content-creation' | 'educational';
  columns: Omit<Column, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>[];
  enableSubtasks: boolean;
  enableDeadlines: boolean;
  enableLabels: boolean;
  enableDashboard: boolean;
  autoArchivePeriod: Project['autoArchivePeriod'];
  labels: Omit<Label, 'id'>[];
};

export interface KanbanState {
  projects: Project[];
  isLoaded: boolean;
  user: User | null;
  showConfetti: boolean;
  actions: KanbanStoreActions;
}

export interface KanbanStoreActions {
  init: (user: User) => () => void;
  clear: () => void;
  hideConfetti: () => void;
  addProject: (options: AddProjectOptions) => Promise<string | null>;
  addColumn: (projectId: string, title: string) => Promise<void>;
  addTask: (
    projectId: string,
    columnId: string,
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'activity'>,
  ) => Promise<void>;
  moveTask: (
    projectId: string,
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
    toIndex: number,
  ) => Promise<void>;
  updateColumnTitle: (projectId: string, columnId: string, title: string) => Promise<void>;
  moveColumn: (projectId: string, draggedColumnId: string, targetColumnId: string) => Promise<void>;
  updateProject: (projectId: string, data: Partial<Omit<Project, 'id'>>) => Promise<void>;
  updateTask: (
    projectId: string,
    taskId: string,
    columnId: string,
    updatedData: Partial<Omit<Task, 'id'>>,
    meta?: { subtaskTitle?: string },
  ) => Promise<void>;
  deleteTask: (projectId: string, taskId: string, columnId: string) => Promise<void>;
  deleteColumn: (projectId: string, columnId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  searchUsers: (searchTerm: string) => Promise<KanbanUser[]>;
  inviteUserToProject: (projectId: string, userToInvite: KanbanUser) => Promise<{ success: boolean; message: string }>;
  getProjectMembers: (projectId: string) => Promise<KanbanUser[]>;
  removeUserFromProject: (projectId: string, userId: string) => Promise<void>;
  cancelInvitation: (projectId: string, userId: string) => Promise<void>;
  handleInvitation: (action: 'accept' | 'decline', projectId: string, invitationId: string) => Promise<void>;
  createLabel: (projectId: string, name: string, color: string) => Promise<void>;
  updateLabel: (projectId: string, labelId: string, name: string, color: string) => Promise<void>;
  deleteLabel: (projectId: string, labelId: string) => Promise<void>;
  addComment: (projectId: string, taskId: string, commentText: string, mentions: string[]) => Promise<void>;
  archiveOldTasks: (projectId: string) => Promise<void>;
}

const addActivity = (task: Task, text: string, userId: string, type: 'log' | 'comment' = 'log'): Activity[] => {
  const newActivity: Activity = {
    id: `activity-${Date.now()}`,
    text,
    timestamp: new Date().toISOString(),
    userId,
    type,
  };
  return [...(task.activity || []), newActivity];
};

export const useKanbanStore = create<KanbanState>((set, get) => ({
  projects: [],
  isLoaded: false,
  user: null,
  showConfetti: false,
  actions: {
    init: (user: User) => {
      set({ user, isLoaded: false });
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, where('members', 'array-contains', user.uid));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const userProjects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project);
          set({ projects: userProjects, isLoaded: true });
        },
        (error) => {
          console.error('Error fetching projects:', error);
          toast({
            title: 'Error Loading Projects',
            description: 'There was an error loading your projects. Please try again later.',
            variant: 'destructive',
          });
          set({ isLoaded: true });
        },
      );

      return unsubscribe;
    },
    clear: () => {
      set({ projects: [], isLoaded: false, user: null });
    },
    hideConfetti: () => set({ showConfetti: false }),
    updateProject: async (projectId: string, data: Partial<Omit<Project, 'id'>>) => {
      const projectRef = doc(db, 'projects', projectId);
      const cleanData = { ...data };
      Object.keys(cleanData).forEach((key) => {
        if (cleanData[key as keyof typeof cleanData] === undefined) {
          delete cleanData[key as keyof typeof cleanData];
        }
      });
      await updateDoc(projectRef, { ...cleanData, updatedAt: new Date().toISOString() });
    },
    addProject: async (options: AddProjectOptions) => {
      const { user } = get();
      if (!user) return null;

      const { name, description, columns, labels, ...features } = options;
      const finalLabels = labels.map((l) => ({ ...l, id: `label-${Date.now()}-${Math.random()}` }));

      const now = new Date().toISOString();
      const newProjectData: Omit<Project, 'id'> = {
        name,
        description: description || '',
        ownerId: user.uid,
        members: [user.uid],
        pendingMembers: [],
        createdAt: now,
        updatedAt: now,
        labels: finalLabels,
        ...features,
        columns: columns.map((ct) => ({
          id: `col-${Date.now()}-${ct.title.replace(/\s+/g, '-')}`,
          title: ct.title,
          tasks: [],
          createdAt: now,
          updatedAt: now,
        })),
      };
      try {
        const docRef = await addDoc(collection(db, 'projects'), newProjectData);
        toast({
          title: 'Project Created',
          description: `The project "${name.trim()}" has been created successfully.`,
          variant: 'default',
        });
        return docRef.id;
      } catch (error) {
        console.error('Error adding project:', error);
        toast({
          title: 'Error Creating Project',
          description: 'There was an error creating your project. Please try again.',
          variant: 'destructive',
        });
        return null;
      }
    },
    addColumn: async (projectId: string, title: string) => {
      const { projects, actions } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const now = new Date().toISOString();
      const newColumn: Column = { id: `col-${Date.now()}`, title, tasks: [], createdAt: now, updatedAt: now };
      const columns = [...project.columns];
      const doneColumnIndex = columns.findIndex((c) => c.title === 'Done');

      if (doneColumnIndex !== -1) {
        columns.splice(doneColumnIndex, 0, newColumn);
      } else {
        columns.push(newColumn);
      }

      try {
        await actions.updateProject(project.id, { columns });
        toast({
          title: 'Column Created',
          description: `Column "${title.trim()}" has been created.`,
          variant: 'default',
        });
      } catch (error) {
        console.error('Error adding column:', error);
        toast({
          title: 'Error Creating Column',
          description: 'There was an error creating the column. Please try again.',
          variant: 'destructive',
        });
      }
    },
    addTask: async (
      projectId: string,
      columnId: string,
      taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'activity'>,
    ) => {
      const { projects, user, actions } = get();
      if (!user) return;
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const now = new Date().toISOString();
      let newTask: Task = {
        id: `task-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        title: taskData.title,
        activity: [],
        isArchived: false,
      };

      if (taskData.description) newTask.description = taskData.description;
      if (taskData.assignee) newTask.assignee = taskData.assignee;
      if (taskData.priority) newTask.priority = taskData.priority;
      if (project.enableDeadlines && taskData.deadline) newTask.deadline = taskData.deadline;
      if (project.enableSubtasks && taskData.parentId) newTask.parentId = taskData.parentId;
      if (project.enableLabels && taskData.labelIds) newTask.labelIds = taskData.labelIds;

      const activityText = taskData.parentId ? `created this sub-task` : `created this task`;

      newTask.activity = addActivity(newTask, activityText, user.uid);

      const column = project.columns.find((c) => c.id === columnId);
      if (column && column.title === 'Done') {
        newTask.completedAt = now;
        newTask.activity = addActivity(newTask, `marked this as <b>complete</b>`, user.uid);
        set({ showConfetti: true });
      }

      let updatedColumns = project.columns.map((c) => (c.id === columnId ? { ...c, tasks: [newTask, ...c.tasks] } : c));

      if (taskData.parentId) {
        updatedColumns = updatedColumns.map((c) => ({
          ...c,
          tasks: c.tasks.map((t) => {
            if (t.id === taskData.parentId) {
              const parentActivityText = `added a sub-task: <b>${newTask.title}</b>`;
              return { ...t, activity: addActivity(t, parentActivityText, user.uid) };
            }
            return t;
          }),
        }));
      }

      try {
        await actions.updateProject(project.id, { columns: updatedColumns });
        toast({
          title: taskData.parentId ? 'Sub-task Created' : 'Task Created',
          description: `Task "${newTask.title.trim()}" has been added.`,
          variant: 'default',
        });
      } catch (error) {
        console.error('Error adding task:', error);
        toast({
          title: 'Error Creating Task',
          description: 'There was an error adding the task. Please try again.',
          variant: 'destructive',
        });
      }
    },
    moveTask: async (projectId: string, taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => {
      const { projects, user, actions } = get();
      if (!user) return;
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const fromColumn = project.columns.find((c) => c.id === fromColumnId);
      const toColumn = project.columns.find((c) => c.id === toColumnId);
      if (!fromColumn || !toColumn) return;

      const taskToMove = fromColumn.tasks.find((t) => t.id === taskId);
      if (!taskToMove) return;

      const allTasks = project.columns.flatMap((c) => c.tasks);
      const subtasks = allTasks.filter((t) => t.parentId === taskId);

      const activityText = `moved this task from <b>${fromColumn.title}</b> to <b>${toColumn.title}</b>`;
      taskToMove.activity = addActivity(taskToMove, activityText, user.uid);

      if (toColumn.title === 'Done') {
        if (subtasks.length > 0 && subtasks.some((st) => !st.completedAt)) {
          toast({
            variant: 'warning',
            title: 'Action Required',
            description: "Please complete all sub-tasks before moving this task to 'Done'.",
          });
          return;
        }
        taskToMove.completedAt = new Date().toISOString();
        taskToMove.activity = addActivity(taskToMove, `marked this as <b>complete</b>`, user.uid);
        set({ showConfetti: true });
      } else {
        taskToMove.completedAt = null;
      }

      taskToMove.updatedAt = new Date().toISOString();

      const newFromColumnTasks = fromColumn.tasks.filter((t) => t.id !== taskId);
      const newToColumnTasks = [...toColumn.tasks];
      newToColumnTasks.splice(toIndex, 0, taskToMove);

      const newColumns = project.columns.map((column) => {
        if (column.id === fromColumnId) {
          return { ...column, tasks: newFromColumnTasks };
        }
        if (column.id === toColumnId) {
          return { ...column, tasks: newToColumnTasks };
        }
        return column;
      });

      try {
        await actions.updateProject(projectId, { columns: newColumns });
      } catch (error) {
        console.error('Error moving task:', error);
        toast({
          title: 'Error Moving Task',
          description: 'There was an error moving the task. Please try again.',
          variant: 'destructive',
        });
      }
    },
    moveColumn: async (projectId: string, draggedColumnId: string, targetColumnId: string) => {
      if (draggedColumnId === targetColumnId) return;
      const { projects, actions } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const columns = [...project.columns];
      const draggedIndex = columns.findIndex((c) => c.id === draggedColumnId);
      const targetIndex = columns.findIndex((c) => c.id === targetColumnId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const [draggedColumn] = columns.splice(draggedIndex, 1);
      columns.splice(targetIndex, 0, draggedColumn);

      try {
        await actions.updateProject(project.id, { columns });
      } catch (error) {
        console.error('Error moving column:', error);
        toast({
          title: 'Error Moving Column',
          description: 'There was an error moving the column. Please try again.',
          variant: 'destructive',
        });
      }
    },
    updateColumnTitle: async (projectId: string, columnId: string, title: string) => {
      const { projects, actions } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const now = new Date().toISOString();
      const updatedColumns = project.columns.map((c) => (c.id === columnId ? { ...c, title, updatedAt: now } : c));
      try {
        await actions.updateProject(project.id, { columns: updatedColumns });
        toast({
          title: 'Column Updated',
          description: `The column title has been changed to "${title.trim()}".`,
          variant: 'default',
        });
      } catch (error) {
        console.error('Error updating column title:', error);
        toast({
          title: 'Error Updating Column',
          description: 'There was an error updating the column title. Please try again.',
          variant: 'destructive',
        });
      }
    },
    updateTask: async (
      projectId: string,
      taskId: string,
      columnId: string,
      updatedData: Partial<Omit<Task, 'id'>>,
      meta?: { subtaskTitle?: string },
    ) => {
      const { projects, user, actions } = get();
      if (!user) return;
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const allMembers = await actions.getProjectMembers(projectId);
      const now = new Date().toISOString();

      let parentTask: Task | undefined;

      const cleanUpdatedData = { ...updatedData };
      Object.keys(cleanUpdatedData).forEach((key) => {
        if (cleanUpdatedData[key as keyof typeof cleanUpdatedData] === undefined) {
          delete cleanUpdatedData[key as keyof typeof cleanUpdatedData];
        }
      });

      const newColumns = project.columns.map((c) => {
        let tasks = c.tasks.map((t) => {
          if (t.id === taskId) {
            const oldTask: Task = { ...t };
            let updatedTask = { ...t, ...cleanUpdatedData, updatedAt: now };

            if (cleanUpdatedData.title && cleanUpdatedData.title !== oldTask.title) {
              updatedTask.activity = addActivity(
                updatedTask,
                `changed the title from <b>${oldTask.title}</b> to <b>${updatedTask.title}</b>`,
                user.uid,
              );
            }
            if (
              cleanUpdatedData.description !== undefined &&
              cleanUpdatedData.description !== (oldTask.description || '')
            ) {
              updatedTask.activity = addActivity(updatedTask, `updated the description`, user.uid);
            }
            if (cleanUpdatedData.assignee !== undefined && cleanUpdatedData.assignee !== (oldTask.assignee || '')) {
              const oldName = allMembers.find((m) => m.uid === oldTask?.assignee)?.displayName ?? 'Unassigned';
              const newName = allMembers.find((m) => m.uid === cleanUpdatedData.assignee)?.displayName ?? 'Unassigned';
              updatedTask.activity = addActivity(
                updatedTask,
                `changed the assignee from <b>${oldName}</b> to <b>${newName}</b>`,
                user.uid,
              );

              if (cleanUpdatedData.assignee) {
                addDoc(collection(db, 'notifications'), {
                  userId: cleanUpdatedData.assignee,
                  text: `You were assigned to the task <b>${updatedTask.title}</b> in project <b>${project.name}</b>`,
                  link: `/p/${projectId}?taskId=${updatedTask.id}`,
                  read: false,
                  createdAt: new Date().toISOString(),
                } as Omit<Notification, 'id'>);
              }
            }
            if (cleanUpdatedData.priority && cleanUpdatedData.priority !== oldTask.priority) {
              updatedTask.activity = addActivity(
                updatedTask,
                `changed priority from <b>${oldTask.priority ?? 'Medium'}</b> to <b>${cleanUpdatedData.priority}</b>`,
                user.uid,
              );
            }
            if (cleanUpdatedData.deadline !== oldTask.deadline) {
              const newDeadline = cleanUpdatedData.deadline
                ? new Date(cleanUpdatedData.deadline).toLocaleDateString()
                : 'no deadline';
              updatedTask.activity = addActivity(updatedTask, `set the deadline to <b>${newDeadline}</b>`, user.uid);
            }
            if (
              cleanUpdatedData.hasOwnProperty('completedAt') &&
              cleanUpdatedData.completedAt !== oldTask.completedAt
            ) {
              const text = cleanUpdatedData.completedAt
                ? 'marked this as <b>complete</b>'
                : 'marked this as <b>incomplete</b>';
              updatedTask.activity = addActivity(updatedTask, text, user.uid);
            }

            if (cleanUpdatedData.isArchived) {
              updatedTask.activity = addActivity(updatedTask, `archived this task`, user.uid);
            }

            if (project.enableLabels && updatedData.labelIds) {
              const oldLabels = oldTask.labelIds || [];
              const newLabels = updatedData.labelIds;
              const added = newLabels.filter((l) => !oldLabels.includes(l));
              const removed = oldLabels.filter((l) => !newLabels.includes(l));

              added.forEach((labelId) => {
                const label = project.labels?.find((l) => l.id === labelId);
                if (label)
                  updatedTask.activity = addActivity(
                    updatedTask,
                    `added the label <b style="color: ${label.color}; background-color: ${label.color}20; padding: 1px 4px; border-radius: 4px;">${label.name}</b>`,
                    user.uid,
                  );
              });
              removed.forEach((labelId) => {
                const label = project.labels?.find((l) => l.id === labelId);
                if (label)
                  updatedTask.activity = addActivity(
                    updatedTask,
                    `removed the label <b style="color: ${label.color}; background-color: ${label.color}20; padding: 1px 4px; border-radius: 4px;">${label.name}</b>`,
                    user.uid,
                  );
              });
            }
            if (updatedTask.parentId) {
              parentTask = project.columns.flatMap((c) => c.tasks).find((t) => t.id === updatedTask.parentId);
            }
            return updatedTask;
          }
          return t;
        });

        if (parentTask && cleanUpdatedData.hasOwnProperty('completedAt')) {
          const parentId = parentTask.id;
          tasks = tasks.map((t) => {
            if (t.id === parentId) {
              const activityText = cleanUpdatedData.completedAt
                ? `completed a sub-task: <b>${meta?.subtaskTitle}</b>`
                : `marked a sub-task as incomplete: <b>${meta?.subtaskTitle}</b>`;
              return { ...t, activity: addActivity(t, activityText, user.uid) };
            }
            return t;
          });
        }
        return { ...c, tasks };
      });

      try {
        await actions.updateProject(projectId, { columns: newColumns });

        const allTasks = newColumns.flatMap((c) => c.tasks);
        const updatedTask = allTasks.find((t) => t.id === taskId);

        if (updatedTask?.parentId && cleanUpdatedData.hasOwnProperty('completedAt')) {
          const parentTask = allTasks.find((t) => t.id === updatedTask.parentId);
          if (parentTask) {
            const subtasks = allTasks.filter((st) => st.parentId === parentTask.id);
            const allSubtasksComplete = subtasks.length > 0 && subtasks.every((st) => !!st.completedAt);

            if (allSubtasksComplete) {
              toast({
                title: 'Sub-tasks Complete',
                description: `You can now move "${parentTask.title}" to the 'Done' column.`,
                variant: 'default',
              });
            }
          }
        }
      } catch (error) {
        console.error('Error updating task:', error);
        toast({
          title: 'Error Updating Task',
          description: 'There was an error updating the task. Please try again.',
          variant: 'destructive',
        });
      }
    },
    deleteTask: async (projectId: string, taskId: string, columnId: string) => {
      const { projects, actions } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const allTasks = project.columns.flatMap((c) => c.tasks);
      const taskToDelete = allTasks.find((t) => t.id === taskId);
      if (!taskToDelete) return;

      const subtaskIds = allTasks.filter((t) => t.parentId === taskId).map((st) => st.id);

      const idsToDelete = [taskId, ...subtaskIds];

      const updatedColumns = project.columns.map((column) => ({
        ...column,
        tasks: column.tasks.filter((t) => !idsToDelete.includes(t.id)),
        updatedAt: new Date().toISOString(),
      }));

      try {
        await actions.updateProject(project.id, { columns: updatedColumns });
        toast({
          title: 'Task Deleted',
          description: `Task "${taskToDelete.title.trim()}" and its sub-tasks were deleted.`,
          variant: 'default',
        });
      } catch (error) {
        console.error('Error deleting task:', error);
        toast({
          title: 'Error Deleting Task',
          description: 'There was an error deleting the task. Please try again.',
          variant: 'destructive',
        });
      }
    },
    deleteColumn: async (projectId: string, columnId: string) => {
      const { projects, actions } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const column = project.columns.find((c) => c.id === columnId);
      if (!column) return;
      if (column.tasks.length > 0) {
        toast({
          variant: 'warning',
          title: 'Cannot Delete Column',
          description: 'Please move or delete all tasks from this column first.',
        });
        return;
      }
      const updatedColumns = project.columns.filter((c) => c.id !== columnId);
      try {
        await actions.updateProject(project.id, { columns: updatedColumns });
        toast({
          title: 'Column Deleted',
          description: `Column "${column.title.trim()}" has been deleted.`,
          variant: 'default',
        });
      } catch (error) {
        console.error('Error deleting column:', error);
        toast({
          title: 'Error Deleting Column',
          description: 'There was an error deleting the column. Please try again.',
          variant: 'destructive',
        });
      }
    },
    deleteProject: async (projectId: string) => {
      const { projects } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const projectRef = doc(db, 'projects', projectId);
      try {
        await deleteDoc(projectRef);
        toast({
          title: 'Project Deleted',
          description: `Project "${project.name.trim()}" has been deleted.`,
          variant: 'default',
        });
      } catch (error) {
        console.error('Error deleting project:', error);
        toast({
          title: 'Error Deleting Project',
          description: 'There was an error deleting the project. Please try again.',
          variant: 'destructive',
        });
      }
    },
    searchUsers: async (searchTerm: string): Promise<KanbanUser[]> => {
      if (searchTerm.trim().length < 2) return [];

      const usersRef = collection(db, 'users');
      const searchTermLower = searchTerm.toLowerCase();

      const nameQuery = query(
        usersRef,
        orderBy('displayName'),
        startAt(searchTerm),
        endAt(searchTerm + '\uf8ff'),
        limit(5),
      );
      const emailQuery = query(
        usersRef,
        orderBy('email'),
        startAt(searchTermLower),
        endAt(searchTermLower + '\uf8ff'),
        limit(5),
      );

      try {
        const [nameSnapshot, emailSnapshot] = await Promise.all([getDocs(nameQuery), getDocs(emailQuery)]);
        const usersMap = new Map<string, KanbanUser>();

        nameSnapshot.docs.forEach((doc) => {
          const userData = doc.data() as KanbanUser;
          usersMap.set(userData.uid, userData);
        });

        emailSnapshot.docs.forEach((doc) => {
          const userData = doc.data() as KanbanUser;
          usersMap.set(userData.uid, userData);
        });

        return Array.from(usersMap.values());
      } catch (error) {
        console.error('Error searching users:', error);
        return [];
      }
    },
    inviteUserToProject: async (projectId: string, userToInvite: KanbanUser) => {
      const { projects, user, actions } = get();
      if (!user) return { success: false, message: 'Current user not found.' };
      const project = projects.find((p) => p.id === projectId);
      if (!project) return { success: false, message: 'Project not found.' };

      if (
        project.members.includes(userToInvite.uid) ||
        project.pendingMembers?.some((pm) => pm.userId === userToInvite.uid)
      ) {
        return { success: false, message: 'User is already a member or has a pending invitation.' };
      }

      const invitationId = `inv-${Date.now()}`;
      const newInvitation: Invitation = {
        id: invitationId,
        userId: userToInvite.uid,
        email: userToInvite.email!,
        displayName: userToInvite.displayName!,
        photoURL: userToInvite.photoURL ?? undefined,
        invitedAt: new Date().toISOString(),
      };

      try {
        await actions.updateProject(projectId, {
          pendingMembers: arrayUnion(newInvitation) as any,
        });

        await addDoc(collection(db, 'notifications'), {
          userId: userToInvite.uid,
          text: `<b>${user.displayName}</b> has invited you to join the project <b>${project.name}</b>`,
          link: '#',
          read: false,
          createdAt: new Date().toISOString(),
          actions: {
            accept: { projectId, invitationId },
            decline: { projectId, invitationId },
          },
        } as Omit<Notification, 'id'>);

        return { success: true, message: `Invitation sent to ${userToInvite.displayName}.` };
      } catch (error) {
        console.error('Error inviting user:', error);
        return { success: false, message: 'Error sending invitation.' };
      }
    },
    getProjectMembers: async (projectId: string): Promise<KanbanUser[]> => {
      const { projects } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project || !project.members) return [];

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', 'in', project.members));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => doc.data() as KanbanUser);
      } catch (e) {
        if (e instanceof Error && e.message.includes("at least one value for 'in' operator")) {
          return [];
        }
        console.error('Error fetching project members:', e);
        return [];
      }
    },
    removeUserFromProject: async (projectId: string, userId: string) => {
      const { actions } = get();
      try {
        await actions.updateProject(projectId, {
          members: arrayRemove(userId) as any,
        });
        toast({
          title: 'User Removed',
          description: `The user has been removed from the project.`,
          variant: 'default',
        });
      } catch (error) {
        console.error('Error removing user:', error);
        toast({
          title: 'Error Removing User',
          description: 'There was an error removing the user from the project.',
          variant: 'destructive',
        });
      }
    },
    cancelInvitation: async (projectId: string, userId: string) => {
      const { projects, actions } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const invitation = project.pendingMembers?.find((pm) => pm.userId === userId);
      if (!invitation) return;

      try {
        await actions.updateProject(projectId, {
          pendingMembers: arrayRemove(invitation) as any,
        });
      } catch (error) {
        console.error('Error cancelling invitation:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not cancel the invitation.' });
      }
    },
    handleInvitation: async (action: 'accept' | 'decline', projectId: string, invitationId: string) => {
      const { user } = get();
      if (!user) return;

      const projectRef = doc(db, 'projects', projectId);

      const projectDoc = await getDoc(projectRef);
      if (!projectDoc.exists()) return;

      const project = { id: projectDoc.id, ...projectDoc.data() } as Project;
      const invitation = project.pendingMembers?.find((pm) => pm.id === invitationId);
      if (!invitation || invitation.userId !== user.uid) return;

      const batch = writeBatch(db);

      const updatedPendingMembers = project.pendingMembers?.filter((pm) => pm.id !== invitationId) ?? [];
      batch.update(projectRef, { pendingMembers: updatedPendingMembers });

      if (action === 'accept') {
        batch.update(projectRef, { members: arrayUnion(user.uid) });

        const ownerNotification: Omit<Notification, 'id'> = {
          userId: project.ownerId,
          text: `<b>${user.displayName}</b> has accepted your invitation to join <b>${project.name}</b>.`,
          link: `/p/${project.id}/config`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        batch.set(doc(collection(db, 'notifications')), ownerNotification);
      } else {
        const ownerNotification: Omit<Notification, 'id'> = {
          userId: project.ownerId,
          text: `<b>${user.displayName}</b> has declined your invitation to join <b>${project.name}</b>.`,
          link: `/p/${project.id}/config`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        batch.set(doc(collection(db, 'notifications')), ownerNotification);
      }

      await batch.commit();
    },
    createLabel: async (projectId: string, name: string, color: string) => {
      const { projects, actions } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const newLabel: Label = { id: `label-${Date.now()}`, name, color };
      const updatedLabels = [...(project.labels || []), newLabel];
      await actions.updateProject(projectId, { labels: updatedLabels });
    },
    updateLabel: async (projectId: string, labelId: string, name: string, color: string) => {
      const { projects, actions } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const updatedLabels = (project.labels || []).map((label) =>
        label.id === labelId ? { ...label, name, color } : label,
      );
      await actions.updateProject(projectId, { labels: updatedLabels });
    },
    deleteLabel: async (projectId: string, labelId: string) => {
      const { projects, actions } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const labelToDelete = project.labels?.find((l) => l.id === labelId);
      if (!labelToDelete) return;

      const updatedLabels = (project.labels || []).filter((label) => label.id !== labelId);

      const updatedColumns = project.columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) => {
          const newLabelIds = (task.labelIds || []).filter((id) => id !== labelId);
          return {
            ...task,
            labelIds: newLabelIds,
          };
        }),
      }));

      await actions.updateProject(projectId, { labels: updatedLabels, columns: updatedColumns });
      toast({
        title: 'Label Deleted',
        description: `Label "${labelToDelete.name}" was successfully removed.`,
        variant: 'default',
      });
    },
    addComment: async (projectId: string, taskId: string, commentText: string, mentions: string[]) => {
      const { projects, user, actions } = get();
      if (!user) return;
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const newColumns = project.columns.map((c) => ({
        ...c,
        tasks: c.tasks.map((t) => {
          if (t.id === taskId) {
            return { ...t, activity: addActivity(t, commentText, user.uid, 'comment') };
          }
          return t;
        }),
      }));

      await actions.updateProject(projectId, { columns: newColumns });

      const task = project.columns.flatMap((c) => c.tasks).find((t) => t.id === taskId);
      if (task) {
        const batch = writeBatch(db);
        mentions.forEach((mentionedUserId) => {
          const notification: Omit<Notification, 'id'> = {
            userId: mentionedUserId,
            text: `<b>${user.displayName}</b> mentioned you in a comment on task <b>${task.title}</b>`,
            link: `/p/${projectId}?taskId=${taskId}`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          const notificationRef = doc(collection(db, 'notifications'));
          batch.set(notificationRef, notification);
        });
        await batch.commit();
      }
    },
    archiveOldTasks: async (projectId: string) => {
      const { projects, user, actions } = get();
      if (!user) return;
      const project = projects.find((p) => p.id === projectId);
      if (!project || !project.autoArchivePeriod || project.autoArchivePeriod === 'never') return;

      const now = new Date();
      let archiveThreshold: Date;

      if (project.autoArchivePeriod === '1-day') {
        archiveThreshold = subDays(now, 1);
      } else if (project.autoArchivePeriod === '1-week') {
        archiveThreshold = subWeeks(now, 1);
      } else if (project.autoArchivePeriod === '1-month') {
        archiveThreshold = subMonths(now, 1);
      } else {
        return;
      }

      let tasksArchivedCount = 0;
      const updatedColumns = project.columns.map((column) => {
        if (column.title === 'Done') {
          return {
            ...column,
            tasks: column.tasks.map((task) => {
              if (task.completedAt && new Date(task.completedAt) < archiveThreshold && !task.isArchived) {
                tasksArchivedCount++;
                return { ...task, isArchived: true };
              }
              return task;
            }),
          };
        }
        return column;
      });

      if (tasksArchivedCount > 0) {
        await actions.updateProject(projectId, { columns: updatedColumns });
        const notification: Omit<Notification, 'id'> = {
          userId: user.uid,
          text: `<b>${tasksArchivedCount}</b> completed task(s) in <b>${project.name}</b> were automatically archived.`,
          link: `/p/${projectId}/all-tasks`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'notifications'), notification);
        toast({
          title: 'Tasks Archived',
          description: `${tasksArchivedCount} completed task(s) have been automatically archived.`,
          variant: 'default',
        });
      }
    },
  },
}));
