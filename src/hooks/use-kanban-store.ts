"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project, Column, Task, KanbanUser } from "@/types/kanban";
import { useAuth } from "./use-auth";
import { toast, ToasterToast } from "./use-toast";
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
  writeBatch,
} from "firebase/firestore";

export type KanbanStore = {
  projects: Project[];
  isLoaded: boolean;
  addProject: (name: string) => Promise<string | null>;
  addColumn: (projectId: string, title: string) => Promise<void>;
  addTask: (
    projectId: string,
    columnId: string,
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt">,
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
  updateProjectName: (projectId: string, newName: string) => Promise<void>;
  updateTask: (
    projectId: string,
    taskId: string,
    columnId: string,
    updatedData: Partial<Omit<Task, "id">>,
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

  const updateProjectData = useCallback(
    async (projectId: string, data: Partial<Omit<Project, "id">>) => {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    },
    [],
  );

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
        await updateProjectData(project.id, { columns });
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
    [projects, updateProjectData],
  );

  const addTask = useCallback(
    async (
      projectId: string,
      columnId: string,
      taskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt">,
    ) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const now = new Date().toISOString();
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      };

      const column = project.columns.find((c) => c.id === columnId);
      if (column && column.title === "Done") {
        newTask.completedAt = now;
      }

      const updatedColumns = project.columns.map((c) =>
        c.id === columnId ? { ...c, tasks: [newTask, ...c.tasks] } : c,
      );

      try {
        await updateProjectData(project.id, { columns: updatedColumns });
        toast({
          id: "task-created",
          title: "Task Created",
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
    [projects, updateProjectData],
  );

  const moveTask = useCallback(
    async (
      projectId: string,
      taskId: string,
      fromColumnId: string,
      toColumnId: string,
      toIndex: number,
    ) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const fromColumn = project.columns.find((c) => c.id === fromColumnId);
      const toColumn = project.columns.find((c) => c.id === toColumnId);
      if (!fromColumn || !toColumn) return;

      const taskToMove = fromColumn.tasks.find((t) => t.id === taskId);
      if (!taskToMove) return;

      const allTasks = project.columns.flatMap((c) => c.tasks);
      const subtasks = allTasks.filter((t) => t.parentId === taskId);

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
        await updateProjectData(projectId, { columns: newColumns });
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
    [projects, updateProjectData],
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
        await updateProjectData(project.id, { columns });
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
    [projects, updateProjectData],
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
        await updateProjectData(project.id, { columns: updatedColumns });
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
    [projects, updateProjectData],
  );

  const updateProjectName = useCallback(
    async (projectId: string, newName: string) => {
      if (!projectId || !newName.trim()) return;

      try {
        await updateProjectData(projectId, { name: newName.trim() });
        toast({
          id: "project-updated",
          title: "Project Updated",
          description: `Project name changed to "${newName.trim()}".`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error updating project name:", error);
        toast({
          id: "project-update-error",
          title: "Error Updating Project",
          description: `Couldn't update project name. Please try again.`,
          variant: "destructive",
        });
      }
    },
    [updateProjectData],
  );

  const updateTask = useCallback(
    async (
      projectId: string,
      taskId: string,
      columnId: string,
      updatedData: Partial<Omit<Task, "id">>,
    ) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const now = new Date().toISOString();

      const newColumns = project.columns.map((c) => {
        return {
          ...c,
          tasks: c.tasks.map((t) => {
            if (t.id === taskId) {
              return { ...t, ...updatedData, updatedAt: now } as Task;
            }
            return t;
          }),
        };
      });

      try {
        await updateProjectData(projectId, { columns: newColumns });

        const allTasks = newColumns.flatMap((c) => c.tasks);
        const updatedTask = allTasks.find((t) => t.id === taskId);

        if (
          updatedTask?.parentId &&
          updatedData.hasOwnProperty("completedAt")
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
    [projects, updateProjectData],
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
        await updateProjectData(project.id, { columns: updatedColumns });
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
    [projects, updateProjectData],
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
        await updateProjectData(project.id, { columns: updatedColumns });
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
    [projects, updateProjectData],
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
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, message: "User not found." };
      }

      const userToInvite = querySnapshot.docs[0].data() as KanbanUser;

      try {
        await updateProjectData(projectId, {
          members: arrayUnion(userToInvite.uid) as any,
        });
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
    [projects, updateProjectData],
  );

  const getProjectMembers = useCallback(
    async (projectId: string): Promise<KanbanUser[]> => {
      const project = projects.find((p) => p.id === projectId);
      if (!project || !project.members) return [];

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "in", project.members));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => doc.data() as KanbanUser);
    },
    [projects],
  );

  const removeUserFromProject = useCallback(
    async (projectId: string, userId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      try {
        await updateProjectData(projectId, {
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
    [projects, updateProjectData],
  );

  return {
    projects,
    addProject,
    addColumn,
    addTask,
    moveTask,
    isLoaded,
    updateColumnTitle,
    moveColumn,
    updateProjectName,
    updateTask,
    deleteTask,
    deleteColumn,
    deleteProject,
    inviteUserToProject,
    getProjectMembers,
    removeUserFromProject,
  };
}
