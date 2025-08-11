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
  runTransaction,
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
  tasks: Task[];
  isLoaded: boolean;
  user: User | null;
  showConfetti: boolean;
  actions: KanbanStoreActions;
  activeProjectId: string | null;
}

export interface KanbanStoreActions {
  init: (user: User) => () => void;
  setActiveProject: (projectId: string) => () => void;
  clear: () => void;
  hideConfetti: () => void;
  addProject: (options: AddProjectOptions) => Promise<string | null>;
  addColumn: (projectId: string, title: string) => Promise<void>;
  addTask: (
    projectId: string,
    columnId: string,
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'activity' | 'projectId'>,
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
    updatedData: Partial<Omit<Task, 'id'>>,
    meta?: { subtaskTitle?: string },
  ) => Promise<void>;
  deleteTask: (projectId: string, taskId: string) => Promise<void>;
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
  migrateProjectToSeparateTasks: (project: Project) => Promise<void>;
  updateUserRole: (projectId: string, userId: string, isAdmin: boolean) => Promise<void>;
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
  tasks: [],
  isLoaded: false,
  user: null,
  showConfetti: false,
  activeProjectId: null,
  actions: {
    init: (user: User) => {
      set({ user, isLoaded: false });
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, where('members', 'array-contains', user.uid));

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const userProjects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project);
          set({ projects: userProjects, isLoaded: true });

          const migrationPromises = userProjects.map((project) => {
            const promises = [];
            if (project.columns.length > 0 && 'tasks' in project.columns[0]) {
              console.log(`Migrating tasks for project: ${project.name} (${project.id})`);
              promises.push(get().actions.migrateProjectToSeparateTasks(project));
            }
            if (!project.admins) {
              console.log(`Migrating admins for project: ${project.name} (${project.id})`);
              promises.push(get().actions.updateProject(project.id, { admins: [project.ownerId] }));
            }
            return Promise.all(promises);
          });

          await Promise.all(migrationPromises);
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
    setActiveProject: (projectId: string) => {
      set({ activeProjectId: projectId, tasks: [] });
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('projectId', '==', projectId));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Task);
          set({ tasks });
        },
        (error) => {
          console.error('Error fetching tasks for project:', projectId, error);
          toast({
            title: 'Error Loading Tasks',
            description: 'Could not load tasks for this project.',
            variant: 'destructive',
          });
        },
      );

      return unsubscribe;
    },
    clear: () => {
      set({ projects: [], tasks: [], isLoaded: false, user: null, activeProjectId: null });
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
        admins: [user.uid],
        pendingMembers: [],
        createdAt: now,
        updatedAt: now,
        labels: finalLabels,
        ...features,
        columns: columns.map((ct) => ({
          id: `col-${Date.now()}-${ct.title.replace(/\s+/g, '-')}`,
          title: ct.title,
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
      const newColumn: Omit<Column, 'tasks'> = { id: `col-${Date.now()}`, title, createdAt: now, updatedAt: now };
      let columns = [...project.columns];
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
      taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'activity' | 'projectId'>,
    ) => {
      const { projects, user } = get();
      if (!user) return;
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const now = new Date().toISOString();
      let newTask: Omit<Task, 'id'> = {
        projectId,
        columnId,
        order: get().tasks.filter((t) => t.columnId === columnId).length,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        title: taskData.title,
        activity: [],
        isArchived: false,
      };

      if (taskData.description) newTask.description = taskData.description;
      if (taskData.assigneeIds) newTask.assigneeIds = taskData.assigneeIds;
      if (taskData.priority) newTask.priority = taskData.priority;
      if (project.enableDeadlines && taskData.deadline) newTask.deadline = taskData.deadline;
      if (project.enableSubtasks && taskData.parentId) newTask.parentId = taskData.parentId;
      if (project.enableLabels && taskData.labelIds) newTask.labelIds = taskData.labelIds;

      const activityText = taskData.parentId ? `created this sub-task` : `created this task`;

      newTask.activity = addActivity(newTask as Task, activityText, user.uid);

      const column = project.columns.find((c) => c.id === columnId);
      if (column && column.title === 'Done') {
        newTask.completedAt = now;
        newTask.activity = addActivity(newTask as Task, `marked this as <b>complete</b>`, user.uid);
        set({ showConfetti: true });
      }

      try {
        await addDoc(collection(db, 'tasks'), newTask);

        if (taskData.parentId) {
          const parentTaskRef = doc(db, 'tasks', taskData.parentId);
          const parentActivityText = `added a sub-task: <b>${newTask.title}</b>`;
          const parentTaskDoc = await getDoc(parentTaskRef);
          if (parentTaskDoc.exists()) {
            const parentTask = parentTaskDoc.data() as Task;
            await updateDoc(parentTaskRef, {
              activity: addActivity(parentTask, parentActivityText, user.uid),
            });
          }
        }
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
      const { projects, user, tasks } = get();
      if (!user) return;
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const fromColumn = project.columns.find((c) => c.id === fromColumnId);
      const toColumn = project.columns.find((c) => c.id === toColumnId);
      if (!fromColumn || !toColumn) return;

      const taskToMove = tasks.find((t) => t.id === taskId);
      if (!taskToMove) return;

      const subtasks = tasks.filter((t) => t.parentId === taskId);

      if (toColumn.title.toLowerCase() === 'done') {
        if (subtasks.length > 0 && subtasks.some((st) => !st.completedAt)) {
          toast({
            variant: 'warning',
            title: 'Action Required',
            description: 'Please complete all sub-tasks before moving this task to the final column.',
          });
          return;
        }
      }

      try {
        await runTransaction(db, async (transaction) => {
          const taskRef = doc(db, 'tasks', taskId);
          const taskDoc = await transaction.get(taskRef);
          if (!taskDoc.exists()) throw 'Task does not exist!';

          const updatedTaskData: Partial<Task> = {
            columnId: toColumnId,
            order: toIndex,
            updatedAt: new Date().toISOString(),
          };

          const activityText = `moved this task from <b>${fromColumn.title}</b> to <b>${toColumn.title}</b>`;
          updatedTaskData.activity = addActivity(taskDoc.data() as Task, activityText, user.uid);

          if (toColumn.title.toLowerCase() === 'done') {
            updatedTaskData.completedAt = new Date().toISOString();
            updatedTaskData.activity = addActivity(updatedTaskData as Task, `marked this as <b>complete</b>`, user.uid);
            set({ showConfetti: true });
          } else {
            updatedTaskData.completedAt = null;
          }

          const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, columnId: toColumnId } : t));
          set({ tasks: updatedTasks });

          transaction.update(taskRef, updatedTaskData);

          const tasksInToColumn = tasks
            .filter((t) => t.columnId === toColumnId && t.id !== taskId)
            .sort((a, b) => a.order - b.order);
          tasksInToColumn.splice(toIndex, 0, { ...taskDoc.data(), ...updatedTaskData } as Task);

          tasksInToColumn.forEach((t, index) => {
            if (t.order !== index) {
              transaction.update(doc(db, 'tasks', t.id), { order: index });
            }
          });

          const tasksInFromColumn = tasks
            .filter((t) => t.columnId === fromColumnId && t.id !== taskId)
            .sort((a, b) => a.order - b.order);

          tasksInFromColumn.forEach((t, index) => {
            if (t.order !== index) {
              transaction.update(doc(db, 'tasks', t.id), { order: index });
            }
          });
        });
        toast({
          title: 'Task Moved',
          description: `Task "${taskToMove.title.trim()}" has been moved to the ${toColumn.title.toLowerCase()} column.`,
          variant: 'default',
        });
      } catch (error) {
        set({ tasks });
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
        toast({
          title: 'Column Moved',
          description: `Column "${draggedColumn.title.trim()}" has been moved.`,
          variant: 'default',
        });
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
      updatedData: Partial<Omit<Task, 'id'>>,
      meta?: { subtaskTitle?: string },
    ) => {
      const { projects, user, actions, tasks } = get();
      if (!user) return;
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const oldTask = tasks.find((t) => t.id === taskId);
      if (!oldTask) return;

      const optimisticTasks = tasks.map((t) => (t.id === taskId ? { ...t, ...updatedData } : t));
      set({ tasks: optimisticTasks });

      const cleanUpdatedData = { ...updatedData };
      Object.keys(cleanUpdatedData).forEach((key) => {
        if (cleanUpdatedData[key as keyof typeof cleanUpdatedData] === undefined) {
          delete cleanUpdatedData[key as keyof typeof cleanUpdatedData];
        }
      });

      const taskRef = doc(db, 'tasks', taskId);

      try {
        await runTransaction(db, async (transaction) => {
          const taskDoc = await transaction.get(taskRef);
          if (!taskDoc.exists()) throw 'Task does not exist';

          const currentTask = taskDoc.data() as Task;
          let finalUpdatedData = { ...updatedData };

          const allMembers = await actions.getProjectMembers(projectId);

          let activityText: string | null = null;

          if (finalUpdatedData.title && finalUpdatedData.title !== currentTask.title) {
            activityText = `changed the title from <b>${currentTask.title}</b> to <b>${finalUpdatedData.title}</b>`;
          }
          if (
            finalUpdatedData.description !== undefined &&
            finalUpdatedData.description !== (currentTask.description || '')
          ) {
            activityText = `updated the description`;
          }
          if (finalUpdatedData.assigneeIds) {
            const currentAssigneeIds = currentTask.assigneeIds || [];
            if (JSON.stringify(finalUpdatedData.assigneeIds.sort()) !== JSON.stringify(currentAssigneeIds.sort())) {
              const oldNames = currentAssigneeIds
                .map((id) => allMembers.find((m) => m.uid === id)?.displayName || 'Unassigned')
                .join(', ');
              const newNames = finalUpdatedData.assigneeIds
                .map((id) => allMembers.find((m) => m.uid === id)?.displayName || 'Unassigned')
                .join(', ');
              activityText = `changed assignees from <b>${oldNames || 'none'}</b> to <b>${newNames || 'none'}</b>`;

              const addedAssignees = finalUpdatedData.assigneeIds.filter((id) => !currentAssigneeIds.includes(id));
              addedAssignees.forEach((assigneeId) => {
                const notificationRef = doc(collection(db, 'notifications'));
                transaction.set(notificationRef, {
                  userId: assigneeId,
                  text: `You were assigned to the task <b>${currentTask.title}</b> in project <b>${project.name}</b>`,
                  link: `/p/${projectId}?taskId=${taskId}`,
                  read: false,
                  createdAt: new Date().toISOString(),
                } as Omit<Notification, 'id'>);
              });
            }
          }
          if (finalUpdatedData.priority && finalUpdatedData.priority !== currentTask.priority) {
            activityText = `changed priority from <b>${currentTask.priority ?? 'Medium'}</b> to <b>${finalUpdatedData.priority}</b>`;
          }
          if (finalUpdatedData.deadline !== currentTask.deadline) {
            const newDeadline = finalUpdatedData.deadline
              ? new Date(finalUpdatedData.deadline).toLocaleDateString()
              : 'no deadline';
            activityText = `set the deadline to <b>${newDeadline}</b>`;
          }
          if (
            finalUpdatedData.hasOwnProperty('completedAt') &&
            finalUpdatedData.completedAt !== currentTask.completedAt
          ) {
            activityText = finalUpdatedData.completedAt
              ? 'marked this as <b>complete</b>'
              : 'marked this as <b>incomplete</b>';
          }
          if (finalUpdatedData.isArchived) {
            activityText = `archived this task`;
          }

          if (project.enableLabels && updatedData.labelIds) {
            const currentLabels = currentTask.labelIds || [];
            const newLabels = updatedData.labelIds;
            const added = newLabels.filter((l) => !currentLabels.includes(l));
            const removed = currentLabels.filter((l) => !newLabels.includes(l));

            if (added.length > 0 || removed.length > 0) {
              activityText = 'updated labels';
            }
          }

          if (activityText) {
            finalUpdatedData.activity = addActivity(currentTask, activityText, user.uid);
          }

          transaction.update(taskRef, finalUpdatedData);

          if (currentTask.parentId && finalUpdatedData.hasOwnProperty('completedAt')) {
            const parentTaskRef = doc(db, 'tasks', currentTask.parentId);
            const parentTaskDoc = await transaction.get(parentTaskRef);
            if (parentTaskDoc.exists()) {
              const parentTask = parentTaskDoc.data() as Task;
              const parentActivityText = finalUpdatedData.completedAt
                ? `completed a sub-task: <b>${meta?.subtaskTitle || currentTask.title}</b>`
                : `marked a sub-task as incomplete: <b>${meta?.subtaskTitle || currentTask.title}</b>`;
              transaction.update(parentTaskRef, { activity: addActivity(parentTask, parentActivityText, user.uid) });
            }
          }
          if (!currentTask.parentId && finalUpdatedData.assigneeIds) {
            const subtasksToUpdate = tasks.filter((t) => t.parentId === taskId);
            subtasksToUpdate.forEach((st) => {
              transaction.update(doc(db, 'tasks', st.id), { assigneeIds: finalUpdatedData.assigneeIds });
            });
          }
        });

        const updatedTask = tasks.find((t) => t.id === taskId);
        if (updatedTask?.parentId && updatedData.hasOwnProperty('completedAt')) {
          const parentTask = tasks.find((t) => t.id === updatedTask.parentId);
          if (parentTask) {
            const subtasks = tasks.filter((st) => st.parentId === parentTask.id);
            const allSubtasksComplete = subtasks.every((st) => !!st.completedAt || st.id === taskId);

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
        set({ tasks });
        console.error('Error updating task:', error);
        toast({
          title: 'Error Updating Task',
          description: 'There was an error updating the task. Please try again.',
          variant: 'destructive',
        });
      }
    },
    deleteTask: async (projectId: string, taskId: string) => {
      const { tasks } = get();
      const taskToDelete = tasks.find((t) => t.id === taskId);
      if (!taskToDelete) return;

      const subtaskIds = tasks.filter((t) => t.parentId === taskId).map((st) => st.id);

      const idsToDelete = [taskId, ...subtaskIds];

      try {
        const batch = writeBatch(db);
        idsToDelete.forEach((id) => {
          batch.delete(doc(db, 'tasks', id));
        });

        await batch.commit();
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
      const { projects, tasks, actions } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const column = project.columns.find((c) => c.id === columnId);
      if (!column) return;
      const tasksInColumn = tasks.filter((t) => t.columnId === columnId);
      if (tasksInColumn.length > 0) {
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
      const { projects, tasks } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      try {
        const batch = writeBatch(db);

        const projectRef = doc(db, 'projects', projectId);
        batch.delete(projectRef);

        const projectTasks = tasks.filter((t) => t.projectId === projectId);
        projectTasks.forEach((task) => {
          batch.delete(doc(db, 'tasks', task.id));
        });

        await batch.commit();
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
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) return [];

      const project = projectDoc.data() as Project;
      if (!project.members || project.members.length === 0) return [];

      try {
        const usersRef = collection(db, 'users');
        const chunks = [];
        for (let i = 0; i < project.members.length; i += 30) {
          chunks.push(project.members.slice(i, i + 30));
        }
        const memberDocs = await Promise.all(
          chunks.map((chunk) => getDocs(query(usersRef, where('uid', 'in', chunk)))),
        );
        return memberDocs.flatMap((snapshot) => snapshot.docs.map((d) => d.data() as KanbanUser));
      } catch (e) {
        console.error('Error fetching project members:', e);
        return [];
      }
    },
    removeUserFromProject: async (projectId: string, userId: string) => {
      const { actions } = get();
      try {
        await actions.updateProject(projectId, {
          members: arrayRemove(userId) as any,
          admins: arrayRemove(userId) as any,
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
      const { projects, actions, tasks } = get();
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const labelToDelete = project.labels?.find((l) => l.id === labelId);
      if (!labelToDelete) return;

      const updatedLabels = (project.labels || []).filter((label) => label.id !== labelId);
      await actions.updateProject(projectId, { labels: updatedLabels });

      const batch = writeBatch(db);
      tasks.forEach((task) => {
        if (task.labelIds?.includes(labelId)) {
          const taskRef = doc(db, 'tasks', task.id);
          batch.update(taskRef, {
            labelIds: arrayRemove(labelId),
          });
        }
      });
      await batch.commit();

      toast({
        title: 'Label Deleted',
        description: `Label "${labelToDelete.name}" was successfully removed.`,
        variant: 'default',
      });
    },
    addComment: async (projectId: string, taskId: string, commentText: string, mentions: string[]) => {
      const { projects, user } = get();
      if (!user) return;
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      if (!taskDoc.exists()) return;

      const task = taskDoc.data() as Task;
      const updatedActivity = addActivity(task, commentText, user.uid, 'comment');
      await updateDoc(taskRef, { activity: updatedActivity });

      if (mentions.length > 0) {
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
      const { projects, user, tasks } = get();
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

      let tasksToArchive = tasks.filter(
        (task) =>
          task.projectId === projectId &&
          task.completedAt &&
          new Date(task.completedAt) < archiveThreshold &&
          !task.isArchived,
      );

      if (tasksToArchive.length > 0) {
        const batch = writeBatch(db);
        tasksToArchive.forEach((task) => {
          const taskRef = doc(db, 'tasks', task.id);
          batch.update(taskRef, { isArchived: true, activity: addActivity(task, 'archived this task', user.uid) });
        });
        await batch.commit();
        const notification: Omit<Notification, 'id'> = {
          userId: user.uid,
          text: `<b>${tasksToArchive.length}</b> completed task(s) in <b>${project.name}</b> were automatically archived.`,
          link: `/p/${projectId}/all-tasks`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'notifications'), notification);
        toast({
          title: 'Tasks Archived',
          description: `${tasksToArchive.length} completed task(s) have been automatically archived.`,
          variant: 'default',
        });
      }
    },
    migrateProjectToSeparateTasks: async (project: Project) => {
      const batch = writeBatch(db);
      let hasMigrated = false;

      const migratedColumns = project.columns.map((column) => {
        // @ts-ignore - tasks property is from the old data model
        const oldTasks: Task[] = column.tasks || [];
        if (oldTasks.length > 0) {
          hasMigrated = true;
        }
        oldTasks.forEach((task, index) => {
          const newTaskId = task.id || `task-${Date.now()}-${Math.random()}`;
          const newTaskRef = doc(db, 'tasks', newTaskId);

          const newTaskData: Task = {
            ...task,
            id: newTaskId,
            projectId: project.id,
            columnId: column.id,
            order: task.order ?? index,
          };
          // @ts-ignore
          delete newTaskData.tasks;
          batch.set(newTaskRef, newTaskData);
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tasks, ...restOfColumn } = column as any;
        return restOfColumn;
      });

      if (hasMigrated) {
        const projectRef = doc(db, 'projects', project.id);
        batch.update(projectRef, { columns: migratedColumns });

        try {
          await batch.commit();
          toast({
            title: 'Migration Complete',
            description: `Project "${project.name}" has been successfully migrated to the new data structure.`,
            variant: 'default',
          });
        } catch (error) {
          console.error('Migration failed for project:', project.id, error);
          toast({
            title: 'Migration Failed',
            description: `Could not migrate project "${project.name}". Please check the console for errors.`,
            variant: 'destructive',
          });
        }
      }
    },
    updateUserRole: async (projectId: string, userId: string, isAdmin: boolean) => {
      const { actions } = get();
      try {
        await actions.updateProject(projectId, {
          admins: isAdmin ? (arrayUnion(userId) as any) : (arrayRemove(userId) as any),
        });
        toast({
          title: 'User Role Updated',
          description: `The user's role has been updated.`,
          variant: 'default',
        });
      } catch (error) {
        console.error('Error updating user role:', error);
        toast({
          title: 'Error Updating Role',
          description: 'There was an error updating the user role.',
          variant: 'destructive',
        });
      }
    },
  },
}));

export const selectTasksByProject = (tasks: Task[], projectId: string) => {
  return tasks.filter((task) => task.projectId === projectId);
};
