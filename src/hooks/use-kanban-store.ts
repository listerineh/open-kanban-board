"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Project,
  Column,
  Task,
  KanbanUser,
  Activity,
  Label,
  Notification,
} from "@/types/kanban";
import { useAuth } from "./use-auth";
import { toast } from "./use-toast";
import { db } from "@/lib/firebase";
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
} from "firebase/firestore";

export type KanbanStore = {
  projects: Project[];
  isLoaded: boolean;
  addProject: (name: string) => Promise<string | null>;
  addColumn: (projectId: string, title: string) => Promise<void>;
  addTask: (
    projectId: string,
    columnId: string,
    taskData: Omit<
      Task,
      "id" | "createdAt" | "updatedAt" | "completedAt" | "activity"
    >,
  ) => Promise<void>;
  moveTask: (
    projectId: string,
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
    toIndex: number,
  ) => Promise<void>;
  updateColumnTitle: (
    projectId: string,
    columnId: string,
    title: string,
  ) => Promise<void>;
  moveColumn: (
    projectId: string,
    draggedColumnId: string,
    targetColumnId: string,
  ) => Promise<void>;
  updateProject: (
    projectId: string,
    data: Partial<Omit<Project, "id">>,
  ) => Promise<void>;
  updateTask: (
    projectId: string,
    taskId: string,
    columnId: string,
    updatedData: Partial<Omit<Task, "id">>,
    meta?: { subtaskTitle?: string },
  ) => Promise<void>;
  deleteTask: (
    projectId: string,
    taskId: string,
    columnId: string,
  ) => Promise<void>;
  deleteColumn: (projectId: string, columnId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  inviteUserToProject: (
    projectId: string,
    email: string,
  ) => Promise<{ success: boolean; message: string }>;
  getProjectMembers: (projectId: string) => Promise<KanbanUser[]>;
  removeUserFromProject: (projectId: string, userId: string) => Promise<void>;
  createLabel: (
    projectId: string,
    name: string,
    color: string,
  ) => Promise<void>;
  updateLabel: (
    projectId: string,
    labelId: string,
    name: string,
    color: string,
  ) => Promise<void>;
  deleteLabel: (projectId: string, labelId: string) => Promise<void>;
  openNewProjectDialog: () => void;
};

// This state is outside the hook to be accessible by the UserNav component
// without causing re-renders of the entire app.
let isNewProjectDialogOpen = false;
const dialogListeners = new Set<(isOpen: boolean) => void>();

const updateDialogState = (isOpen: boolean) => {
  isNewProjectDialogOpen = isOpen;
  dialogListeners.forEach((listener) => listener(isOpen));
};

export function useKanbanStore(): KanbanStore {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const getCacheKey = useCallback(
    () => (user ? `kanban-cache-${user.uid}` : null),
    [user],
  );

  useEffect(() => {
    if (!user) {
      const cacheKey = getCacheKey();
      if (cacheKey) {
        try {
          localStorage.removeItem(cacheKey);
        } catch (e) {
          console.error("Could not clear cache", e);
        }
      }
      setProjects([]);
      setIsLoaded(true);
      return;
    }

    const cacheKey = getCacheKey();
    if (cacheKey) {
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          setProjects(JSON.parse(cachedData));
        }
      } catch (e) {
        console.error("Could not load from cache", e);
      }
    }
    setIsLoaded(false);

    const projectsRef = collection(db, "projects");
    const q = query(projectsRef, where("members", "array-contains", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userProjects = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Project,
        );
        setProjects(userProjects);
        setIsLoaded(true);

        const cacheKey = getCacheKey();
        if (cacheKey) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(userProjects));
          } catch (e) {
            console.error("Could not save to cache", e);
          }
        }
      },
      (error) => {
        console.error("Error fetching projects:", error);
        toast({
          id: "projects-loaded-error",
          title: "Error Loading Projects",
          description:
            "There was an error loading your projects. Please try again later.",
          variant: "destructive",
        });
        setIsLoaded(true);
      },
    );

    return () => unsubscribe();
  }, [user, getCacheKey]);

  const updateProject = useCallback(
    async (projectId: string, data: Partial<Omit<Project, "id">>) => {
      const projectRef = doc(db, "projects", projectId);
      const cleanData = { ...data };
      // Firestore does not support undefined values.
      Object.keys(cleanData).forEach((key) => {
        if (cleanData[key as keyof typeof cleanData] === undefined) {
          delete cleanData[key as keyof typeof cleanData];
        }
      });
      await updateDoc(projectRef, {
        ...cleanData,
        updatedAt: new Date().toISOString(),
      });
    },
    [],
  );

  const addActivity = (
    task: Task,
    text: string,
    userId: string,
  ): Activity[] => {
    const newActivity: Activity = {
      id: `activity-${Date.now()}`,
      text,
      timestamp: new Date().toISOString(),
      userId,
    };
    return [...(task.activity || []), newActivity];
  };

  const addProject = useCallback(
    async (name: string) => {
      if (!user) return null;
      const now = new Date().toISOString();
      const newProjectData: Omit<Project, "id"> = {
        name,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: now,
        updatedAt: now,
        enableSubtasks: true,
        enableDeadlines: true,
        enableLabels: true,
        enableDashboard: false,
        labels: [
          { id: `label-${Date.now()}-1`, name: "Bug", color: "#ef4444" },
          { id: `label-${Date.now()}-2`, name: "Feature", color: "#3b82f6" },
          {
            id: `label-${Date.now()}-3`,
            name: "Improvement",
            color: "#22c55e",
          },
        ],
        columns: [
          {
            id: `col-${Date.now()}-1`,
            title: "To Do",
            tasks: [],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: `col-${Date.now()}-2`,
            title: "In Progress",
            tasks: [],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: `col-${Date.now()}-3`,
            title: "Done",
            tasks: [],
            createdAt: now,
            updatedAt: now,
          },
        ],
      };
      try {
        const docRef = await addDoc(collection(db, "projects"), newProjectData);
        toast({
          id: "project-created",
          title: "Project Created",
          description: `The project "${name.trim()}" has been created successfully.`,
          variant: "default",
        });
        return docRef.id;
      } catch (error) {
        console.error("Error adding project:", error);
        toast({
          id: "project-created-error",
          title: "Error Creating Project",
          description:
            "There was an error creating your project. Please try again.",
          variant: "destructive",
        });
        return null;
      }
    },
    [user],
  );

  const addColumn = useCallback(
    async (projectId: string, title: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const now = new Date().toISOString();
      const newColumn: Column = {
        id: `col-${Date.now()}`,
        title,
        tasks: [],
        createdAt: now,
        updatedAt: now,
      };
      const columns = [...project.columns];
      const doneColumnIndex = columns.findIndex((c) => c.title === "Done");

      if (doneColumnIndex !== -1) {
        columns.splice(doneColumnIndex, 0, newColumn);
      } else {
        columns.push(newColumn);
      }

      try {
        await updateProject(project.id, { columns });
        toast({
          id: "column-created",
          title: "Column Created",
          description: `Column "${title.trim()}" has been created.`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error adding column:", error);
        toast({
          id: "column-created-error",
          title: "Error Creating Column",
          description:
            "There was an error creating the column. Please try again.",
          variant: "destructive",
        });
      }
    },
    [projects, updateProject],
  );

  const addTask = useCallback(
    async (
      projectId: string,
      columnId: string,
      taskData: Omit<
        Task,
        "id" | "createdAt" | "updatedAt" | "completedAt" | "activity"
      >,
    ) => {
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
      };

      if (taskData.description) newTask.description = taskData.description;
      if (taskData.assignee) newTask.assignee = taskData.assignee;
      if (taskData.priority) newTask.priority = taskData.priority;
      if (project.enableDeadlines && taskData.deadline)
        newTask.deadline = taskData.deadline;
      if (project.enableSubtasks && taskData.parentId)
        newTask.parentId = taskData.parentId;
      if (project.enableLabels && taskData.labelIds)
        newTask.labelIds = taskData.labelIds;

      const activityText = taskData.parentId
        ? `created this sub-task`
        : `created this task`;

      newTask.activity = addActivity(newTask, activityText, user.uid);

      const column = project.columns.find((c) => c.id === columnId);
      if (column && column.title === "Done") {
        newTask.completedAt = now;
        newTask.activity = addActivity(
          newTask,
          `marked this as <b>complete</b>`,
          user.uid,
        );
      }

      let updatedColumns = project.columns.map((c) =>
        c.id === columnId ? { ...c, tasks: [newTask, ...c.tasks] } : c,
      );

      // If it's a subtask, add activity to parent
      if (taskData.parentId) {
        updatedColumns = updatedColumns.map((c) => ({
          ...c,
          tasks: c.tasks.map((t) => {
            if (t.id === taskData.parentId) {
              const parentActivityText = `added a sub-task: <b>${newTask.title}</b>`;
              return {
                ...t,
                activity: addActivity(t, parentActivityText, user.uid),
              };
            }
            return t;
          }),
        }));
      }

      try {
        await updateProject(project.id, { columns: updatedColumns });
        toast({
          id: "task-created",
          title: taskData.parentId ? "Sub-task Created" : "Task Created",
          description: `Task "${newTask.title.trim()}" has been added.`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error adding task:", error);
        toast({
          id: "task-created-error",
          title: "Error Creating Task",
          description: "There was an error adding the task. Please try again.",
          variant: "destructive",
        });
      }
    },
    [projects, updateProject, user],
  );

  const moveTask = useCallback(
    async (
      projectId: string,
      taskId: string,
      fromColumnId: string,
      toColumnId: string,
      toIndex: number,
    ) => {
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

      if (toColumn.title === "Done") {
        if (subtasks.length > 0 && subtasks.some((st) => !st.completedAt)) {
          toast({
            variant: "warning",
            title: "Action Required",
            description:
              "Please complete all sub-tasks before moving this task to 'Done'.",
          });
          return;
        }
        taskToMove.completedAt = new Date().toISOString();
        taskToMove.activity = addActivity(
          taskToMove,
          `marked this as <b>complete</b>`,
          user.uid,
        );
      } else {
        taskToMove.completedAt = null;
      }

      taskToMove.updatedAt = new Date().toISOString();

      const newFromColumnTasks = fromColumn.tasks.filter(
        (t) => t.id !== taskId,
      );
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
        await updateProject(projectId, { columns: newColumns });
      } catch (error) {
        console.error("Error moving task:", error);
        toast({
          id: "task-moved-error",
          title: "Error Moving Task",
          description: "There was an error moving the task. Please try again.",
          variant: "destructive",
        });
      }
    },
    [projects, updateProject, user],
  );

  const moveColumn = useCallback(
    async (
      projectId: string,
      draggedColumnId: string,
      targetColumnId: string,
    ) => {
      if (draggedColumnId === targetColumnId) return;
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const columns = [...project.columns];
      const draggedIndex = columns.findIndex((c) => c.id === draggedColumnId);
      const targetIndex = columns.findIndex((c) => c.id === targetColumnId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const [draggedColumn] = columns.splice(draggedIndex, 1);
      columns.splice(targetIndex, 0, draggedColumn);

      try {
        await updateProject(project.id, { columns });
      } catch (error) {
        console.error("Error moving column:", error);
        toast({
          id: "column-moved-error",
          title: "Error Moving Column",
          description:
            "There was an error moving the column. Please try again.",
          variant: "destructive",
        });
      }
    },
    [projects, updateProject],
  );

  const updateColumnTitle = useCallback(
    async (projectId: string, columnId: string, title: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const now = new Date().toISOString();
      const updatedColumns = project.columns.map((c) =>
        c.id === columnId ? { ...c, title, updatedAt: now } : c,
      );
      try {
        await updateProject(project.id, { columns: updatedColumns });
        toast({
          id: "column-updated",
          title: "Column Updated",
          description: `The column title has been changed to "${title.trim()}".`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error updating column title:", error);
        toast({
          id: "column-updated-error",
          title: "Error Updating Column",
          description:
            "There was an error updating the column title. Please try again.",
          variant: "destructive",
        });
      }
    },
    [projects, updateProject],
  );

  const updateTask = useCallback(
    async (
      projectId: string,
      taskId: string,
      columnId: string,
      updatedData: Partial<Omit<Task, "id">>,
      meta?: { subtaskTitle?: string },
    ) => {
      if (!user) return;
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const allMembers = await getProjectMembers(projectId);
      const now = new Date().toISOString();

      let parentTask: Task | undefined;

      // Clean updatedData to remove any undefined values before processing
      const cleanUpdatedData = { ...updatedData };
      Object.keys(cleanUpdatedData).forEach((key) => {
        if (
          cleanUpdatedData[key as keyof typeof cleanUpdatedData] === undefined
        ) {
          delete cleanUpdatedData[key as keyof typeof cleanUpdatedData];
        }
      });

      const newColumns = project.columns.map((c) => {
        let tasks = c.tasks.map((t) => {
          if (t.id === taskId) {
            const oldTask: Task = { ...t };
            let updatedTask = { ...t, ...cleanUpdatedData, updatedAt: now };

            if (
              cleanUpdatedData.title &&
              cleanUpdatedData.title !== oldTask.title
            ) {
              updatedTask.activity = addActivity(
                updatedTask,
                `changed the title from <b>${oldTask.title}</b> to <b>${updatedTask.title}</b>`,
                user.uid,
              );
            }
            if (
              cleanUpdatedData.description !== undefined &&
              cleanUpdatedData.description !== (oldTask.description ?? "")
            ) {
              updatedTask.activity = addActivity(
                updatedTask,
                `updated the description`,
                user.uid,
              );
            }
            if (
              cleanUpdatedData.assignee !== undefined &&
              cleanUpdatedData.assignee !== (oldTask.assignee ?? "")
            ) {
              const oldName =
                allMembers.find((m) => m.uid === oldTask?.assignee)
                  ?.displayName ?? "Unassigned";
              const newName =
                allMembers.find((m) => m.uid === cleanUpdatedData.assignee)
                  ?.displayName ?? "Unassigned";
              updatedTask.activity = addActivity(
                updatedTask,
                `changed the assignee from <b>${oldName}</b> to <b>${newName}</b>`,
                user.uid,
              );

              // Create notification for the new assignee
              if (cleanUpdatedData.assignee) {
                addDoc(collection(db, "notifications"), {
                  userId: cleanUpdatedData.assignee,
                  text: `You were assigned to the task <b>${updatedTask.title}</b> in project <b>${project.name}</b>`,
                  link: `/p/${projectId}?taskId=${updatedTask.id}`,
                  read: false,
                  createdAt: new Date().toISOString(),
                } as Omit<Notification, "id">);
              }
            }
            if (
              cleanUpdatedData.priority &&
              cleanUpdatedData.priority !== oldTask.priority
            ) {
              updatedTask.activity = addActivity(
                updatedTask,
                `changed priority from <b>${oldTask.priority ?? "Medium"}</b> to <b>${cleanUpdatedData.priority}</b>`,
                user.uid,
              );
            }
            if (cleanUpdatedData.deadline !== oldTask.deadline) {
              const newDeadline = cleanUpdatedData.deadline
                ? new Date(cleanUpdatedData.deadline).toLocaleDateString()
                : "no deadline";
              updatedTask.activity = addActivity(
                updatedTask,
                `set the deadline to <b>${newDeadline}</b>`,
                user.uid,
              );
            }
            if (
              cleanUpdatedData.hasOwnProperty("completedAt") &&
              cleanUpdatedData.completedAt !== oldTask.completedAt
            ) {
              const text = cleanUpdatedData.completedAt
                ? "marked this as <b>complete</b>"
                : "marked this as <b>incomplete</b>";
              updatedTask.activity = addActivity(updatedTask, text, user.uid);
            }

            if (project.enableLabels && cleanUpdatedData.labelIds) {
              const oldLabels = oldTask.labelIds || [];
              const newLabels = cleanUpdatedData.labelIds;
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
              parentTask = project.columns
                .flatMap((c) => c.tasks)
                .find((t) => t.id === updatedTask.parentId);
            }
            return updatedTask;
          }
          return t;
        });

        // This is for logging subtask completion on the parent task.
        if (parentTask && cleanUpdatedData.hasOwnProperty("completedAt")) {
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
        await updateProject(projectId, { columns: newColumns });

        const allTasks = newColumns.flatMap((c) => c.tasks);
        const updatedTask = allTasks.find((t) => t.id === taskId);

        if (
          updatedTask?.parentId &&
          cleanUpdatedData.hasOwnProperty("completedAt")
        ) {
          const parentTask = allTasks.find(
            (t) => t.id === updatedTask.parentId,
          );
          if (parentTask) {
            const subtasks = allTasks.filter(
              (st) => st.parentId === parentTask.id,
            );
            const allSubtasksComplete =
              subtasks.length > 0 && subtasks.every((st) => !!st.completedAt);

            if (allSubtasksComplete) {
              toast({
                id: "subtasks-complete-info",
                title: "Sub-tasks Complete",
                description: `You can now move "${parentTask.title}" to the 'Done' column.`,
                variant: "default",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error updating task:", error);
        toast({
          id: `task-update-error-${taskId}`,
          title: "Error Updating Task",
          description:
            "There was an error updating the task. Please try again.",
          variant: "destructive",
        });
      }
    },
    [projects, updateProject, user],
  );

  const deleteTask = useCallback(
    async (projectId: string, taskId: string, columnId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const allTasks = project.columns.flatMap((c) => c.tasks);
      const taskToDelete = allTasks.find((t) => t.id === taskId);
      if (!taskToDelete) return;

      const subtaskIds = allTasks
        .filter((t) => t.parentId === taskId)
        .map((st) => st.id);

      const idsToDelete = [taskId, ...subtaskIds];

      const updatedColumns = project.columns.map((column) => ({
        ...column,
        tasks: column.tasks.filter((t) => !idsToDelete.includes(t.id)),
        updatedAt: new Date().toISOString(),
      }));

      try {
        await updateProject(project.id, { columns: updatedColumns });
        toast({
          id: "task-deleted",
          title: "Task Deleted",
          description: `Task "${taskToDelete.title.trim()}" and its sub-tasks were deleted.`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error deleting task:", error);
        toast({
          id: "task-deleted-error",
          title: "Error Deleting Task",
          description:
            "There was an error deleting the task. Please try again.",
          variant: "destructive",
        });
      }
    },
    [projects, updateProject],
  );

  const deleteColumn = useCallback(
    async (projectId: string, columnId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const column = project.columns.find((c) => c.id === columnId);
      if (!column) return;
      if (column.tasks.length > 0) {
        toast({
          variant: "warning",
          title: "Cannot Delete Column",
          description:
            "Please move or delete all tasks from this column first.",
        });
        return;
      }
      const updatedColumns = project.columns.filter((c) => c.id !== columnId);
      try {
        await updateProject(project.id, { columns: updatedColumns });
        toast({
          id: "column-deleted",
          title: "Column Deleted",
          description: `Column "${column.title.trim()}" has been deleted.`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error deleting column:", error);
        toast({
          id: "column-deleted-error",
          title: "Error Deleting Column",
          description:
            "There was an error deleting the column. Please try again.",
          variant: "destructive",
        });
      }
    },
    [projects, updateProject],
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const projectRef = doc(db, "projects", projectId);
      try {
        await deleteDoc(projectRef);
        toast({
          id: "project-deleted",
          title: "Project Deleted",
          description: `Project "${project.name.trim()}" has been deleted.`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error deleting project:", error);
        toast({
          id: "project-deleted-error",
          title: "Error Deleting Project",
          description:
            "There was an error deleting the project. Please try again.",
          variant: "destructive",
        });
      }
    },
    [projects],
  );

  const inviteUserToProject = useCallback(
    async (projectId: string, email: string) => {
      if (!user) return { success: false, message: "User not authenticated." };
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, message: "User not found." };
      }

      const userToInvite = querySnapshot.docs[0].data() as KanbanUser;
      const project = projects.find((p) => p.id === projectId);
      if (!project) return { success: false, message: "Project not found." };

      try {
        await updateProject(projectId, {
          members: arrayUnion(userToInvite.uid) as any,
        });

        await addDoc(collection(db, "notifications"), {
          userId: userToInvite.uid,
          text: `You have been invited to the project <b>${project.name}</b>`,
          link: `/p/${projectId}`,
          read: false,
          createdAt: new Date().toISOString(),
        } as Omit<Notification, "id">);

        toast({
          id: "user-invited",
          title: "User Invited",
          description: `An invitation has been sent to ${email}.`,
          variant: "default",
        });
        return { success: true, message: `User ${email} invited.` };
      } catch (error) {
        console.error("Error inviting user:", error);
        toast({
          id: "user-invited-error",
          title: "Error Inviting User",
          description:
            "There was an error inviting the user. Please try again.",
          variant: "destructive",
        });
        return { success: false, message: "Error inviting user." };
      }
    },
    [updateProject, user, projects],
  );

  const getProjectMembers = useCallback(
    async (projectId: string): Promise<KanbanUser[]> => {
      const project = projects.find((p) => p.id === projectId);
      if (!project || !project.members) return [];

      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("uid", "in", project.members));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => doc.data() as KanbanUser);
      } catch (e) {
        // This can happen if project.members is empty, which is a valid case.
        if (
          e instanceof Error &&
          e.message.includes("at least one value for 'in' operator")
        ) {
          return [];
        }
        console.error("Error fetching project members:", e);
        return [];
      }
    },
    [projects],
  );

  const removeUserFromProject = useCallback(
    async (projectId: string, userId: string) => {
      try {
        await updateProject(projectId, {
          members: arrayRemove(userId) as any,
        });
        toast({
          id: "user-removed",
          title: "User Removed",
          description: `The user has been removed from the project.`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error removing user:", error);
        toast({
          id: "user-removed-error",
          title: "Error Removing User",
          description: "There was an error removing the user from the project.",
          variant: "destructive",
        });
      }
    },
    [updateProject],
  );

  const createLabel = useCallback(
    async (projectId: string, name: string, color: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const newLabel: Label = { id: `label-${Date.now()}`, name, color };
      const updatedLabels = [...(project.labels || []), newLabel];
      await updateProject(projectId, { labels: updatedLabels });
    },
    [projects, updateProject],
  );

  const updateLabel = useCallback(
    async (projectId: string, labelId: string, name: string, color: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const updatedLabels = (project.labels || []).map((label) =>
        label.id === labelId ? { ...label, name, color } : label,
      );
      await updateProject(projectId, { labels: updatedLabels });
    },
    [projects, updateProject],
  );

  const deleteLabel = useCallback(
    async (projectId: string, labelId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const labelToDelete = project.labels?.find((l) => l.id === labelId);
      if (!labelToDelete) return;

      const updatedLabels = (project.labels || []).filter(
        (label) => label.id !== labelId,
      );

      // Also remove this labelId from all tasks
      const updatedColumns = project.columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) => {
          const newLabelIds = (task.labelIds || []).filter(
            (id) => id !== labelId,
          );
          return {
            ...task,
            labelIds: newLabelIds,
          };
        }),
      }));

      await updateProject(projectId, {
        labels: updatedLabels,
        columns: updatedColumns,
      });
      toast({
        id: "label-deleted",
        title: "Label Deleted",
        description: `Label "${labelToDelete.name}" was successfully removed.`,
        variant: "default",
      });
    },
    [projects, updateProject],
  );

  const openNewProjectDialog = useCallback(() => {
    updateDialogState(true);
  }, []);

  return useMemo(
    () => ({
      projects,
      isLoaded,
      addProject,
      addColumn,
      addTask,
      moveTask,
      updateColumnTitle,
      moveColumn,
      updateProject,
      updateTask,
      deleteTask,
      deleteColumn,
      deleteProject,
      inviteUserToProject,
      getProjectMembers,
      removeUserFromProject,
      createLabel,
      updateLabel,
      deleteLabel,
      openNewProjectDialog,
    }),
    [
      projects,
      isLoaded,
      addProject,
      addColumn,
      addTask,
      moveTask,
      updateColumnTitle,
      moveColumn,
      updateProject,
      updateTask,
      deleteTask,
      deleteColumn,
      deleteProject,
      inviteUserToProject,
      getProjectMembers,
      removeUserFromProject,
      createLabel,
      updateLabel,
      deleteLabel,
      openNewProjectDialog,
    ],
  );
}
