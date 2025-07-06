"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Project, Column, Task, KanbanUser } from '@/types/kanban';
import { useAuth } from './use-auth';
import { toast, ToasterToast } from './use-toast';
import { db } from '@/lib/firebase';
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
} from 'firebase/firestore';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export type KanbanStore = {
  projects: Project[];
  activeProjectId: string | null;
  isLoaded: boolean;
  activeProject: Project | undefined;
  addProject: (name: string) => Promise<void>;
  setActiveProjectId: (id: string | null) => void;
  addColumn: (title: string) => Promise<void>;
  addTask: (columnId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>) => Promise<void>;
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => Promise<void>;
  updateColumnTitle: (projectId: string, columnId: string, title: string) => Promise<void>;
  moveColumn: (draggedColumnId: string, targetColumnId: string) => Promise<void>;
  updateProjectName: (projectId: string, newName: string) => Promise<void>;
  updateTask: (taskId: string, columnId: string, updatedData: Partial<Omit<Task, 'id'>>) => Promise<void>;
  deleteTask: (taskId: string, columnId: string) => Promise<void>;
  deleteColumn: (projectId: string, columnId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  inviteUserToProject: (projectId: string, email: string) => Promise<{ success: boolean; message: string }>;
  getProjectMembers: (projectId: string) => Promise<KanbanUser[]>;
  removeUserFromProject: (projectId: string, userId: string) => Promise<void>;
};

export function useKanbanStore(): KanbanStore {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState<ToasterToast | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const urlProjectId = searchParams.get('projectId');

  useEffect(() => {
    if (toastMessage) {
      toast(toastMessage);
      setToastMessage(null);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setActiveProjectId(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where('members', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(userProjects);
      setIsLoaded(true);
    }, (error) => {
        console.error("Error fetching projects:", error);
        setToastMessage({
          id: 'projects-loaded-error',
          title: 'Error loading projects',
          description: 'There was an error loading your projects, try again later.',
          variant: 'destructive',
        });
        setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!isLoaded || pathname.startsWith('/config/')) {
      return;
    }

    const urlProjectIsValid = urlProjectId && projects.some(p => p.id === urlProjectId);
    if (urlProjectIsValid) {
        if (activeProjectId !== urlProjectId) {
            setActiveProjectId(urlProjectId);
        }
        return;
    }

    const activeProjectInStateIsValid = activeProjectId && projects.some(p => p.id === activeProjectId);
    if (activeProjectInStateIsValid) {
        router.replace(`/?projectId=${activeProjectId}`);
        return;
    }

    if (projects.length > 0) {
        router.replace(`/?projectId=${projects[0].id}`);
        return;
    }

    if (urlProjectId) {
        router.replace('/');
    }
  }, [isLoaded, projects, urlProjectId, activeProjectId, pathname, router]);

  const selectProject = (id: string | null) => {
    router.push(id ? `/?projectId=${id}` : '/');
  };

  const getProjectDoc = useCallback((projectId: string | null) => {
      if (!projectId) throw new Error("No active project");
      return doc(db, 'projects', projectId);
  }, []);

  const getProjectById = useCallback((projectId: string | null) => {
    return projects.find(p => p.id === projectId);
  }, [projects]);

  const getActiveProject = useCallback(() => {
    const project = projects.find(p => p.id === activeProjectId);
    if (!project) throw new Error("Active project not found");
    return project;
  }, [projects, activeProjectId]);

  const updateProjectData = async (projectId: string, data: Partial<Omit<Project, 'id'>>) => {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, { ...data, updatedAt: new Date().toISOString() });
  }

  const addProject = async (name: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    const newProjectData: Omit<Project, 'id'> = {
      name,
      ownerId: user.uid,
      members: [user.uid],
      createdAt: now,
      updatedAt: now,
      columns: [
        { id: `col-${Date.now()}-1`, title: 'To Do', tasks: [], createdAt: now, updatedAt: now },
        { id: `col-${Date.now()}-2`, title: 'In Progress', tasks: [], createdAt: now, updatedAt: now },
        { id: `col-${Date.now()}-3`, title: 'Done', tasks: [], createdAt: now, updatedAt: now },
      ],
    };
    const docRef = await addDoc(collection(db, 'projects'), newProjectData);
    selectProject(docRef.id);
    setToastMessage({
      id: 'project-created',
      title: 'Project created',
      description: `Project ${newProjectData.name.trim()} created successfully!`,
      variant: 'default',
    });
  };

  const addColumn = async (title: string) => {
    const project = getActiveProject();
    const now = new Date().toISOString();
    const newColumn: Column = { id: `col-${Date.now()}`, title, tasks: [], createdAt: now, updatedAt: now };
    const columns = [...project.columns];
    const doneColumnIndex = columns.findIndex(c => c.title === 'Done');

    if (doneColumnIndex !== -1) {
      columns.splice(doneColumnIndex, 0, newColumn);
    } else {
      columns.push(newColumn);
    }

    await updateProjectData(project.id, { columns });
    setToastMessage({
      id: 'column-created',
      title: 'Column created',
      description: `Column ${newColumn.title.trim()} created successfully!`,
      variant: 'default',
    });
  };
  
  const addTask = async (columnId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>) => {
    const project = getActiveProject();
    const now = new Date().toISOString();
    const newTask: Task = { ...taskData, id: `task-${Date.now()}`, createdAt: now, updatedAt: now };
    const column = project.columns.find(c => c.id === columnId);
    if (column && column.title === 'Done') {
        newTask.completedAt = now;
    }
    const updatedColumns = project.columns.map(c => 
        c.id === columnId ? { ...c, tasks: [...c.tasks, newTask] } : c
    );
    await updateProjectData(project.id, { columns: updatedColumns });
    setToastMessage({
      id: 'task-created',
      title: 'Task created',
      description: `Task ${newTask.title.trim()} created successfully!`,
      variant: 'default',
    });
  };

  const moveTask = async (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => {
    const project = getActiveProject();
    const fromCol = project.columns.find(c => c.id === fromColumnId);
    const originalTask = fromCol?.tasks.find(t => t.id === taskId);
    
    if (!originalTask) return;
    
    const toCol = project.columns.find(c => c.id === toColumnId);
    
    const taskToMove: Task = { ...originalTask, updatedAt: new Date().toISOString() };
    
    if (toCol?.title === 'Done') {
      if (!taskToMove.completedAt) {
        taskToMove.completedAt = new Date().toISOString();
      }
    } else {
      if (taskToMove.completedAt) {
        delete (taskToMove as Partial<Task>).completedAt;
      }
    }
    
    const updatedColumns = [...project.columns];
    
    const sourceColIndex = updatedColumns.findIndex(c => c.id === fromColumnId);
    if (sourceColIndex > -1) {
      updatedColumns[sourceColIndex] = {
        ...updatedColumns[sourceColIndex],
        tasks: updatedColumns[sourceColIndex].tasks.filter(t => t.id !== taskId)
      };
    }
    
    const destColIndex = updatedColumns.findIndex(c => c.id === toColumnId);
    if (destColIndex > -1) {
      const destTasks = [...updatedColumns[destColIndex].tasks];
      destTasks.splice(toIndex, 0, taskToMove);
      updatedColumns[destColIndex] = {
        ...updatedColumns[destColIndex],
        tasks: destTasks
      };
    }

    await updateProjectData(project.id, { columns: updatedColumns });
    setToastMessage({
      id: 'column-moved',
      title: 'Column moved',
      description: `Column ${taskToMove.title.trim()} moved successfully!`,
      variant: 'default',
    });
  };

  const moveColumn = async (draggedColumnId: string, targetColumnId: string) => {
    if (draggedColumnId === targetColumnId) return;
    const project = getActiveProject();
    const columns = [...project.columns];
    const draggedIndex = columns.findIndex(c => c.id === draggedColumnId);
    let targetIndex = columns.findIndex(c => c.id === targetColumnId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedColumn] = columns.splice(draggedIndex, 1);
    const doneColumn = columns.find(c => c.title === 'Done');
    if (doneColumn && targetColumnId === doneColumn.id) {
        const doneIndex = columns.findIndex(c => c.id === doneColumn.id);
        columns.splice(doneIndex, 0, draggedColumn);
    } else {
        if (draggedIndex < targetIndex) {
            targetIndex--;
        }
        columns.splice(targetIndex, 0, draggedColumn);
    }
    await updateProjectData(project.id, { columns });
    setToastMessage({
      id: 'column-moved',
      title: 'Column moved',
      description: `Column ${draggedColumn.title.trim()} moved successfully!`,
      variant: 'default',
    });
  };
  
  const updateColumnTitle = async (projectId: string, columnId: string, title: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error("Project not found");
    const now = new Date().toISOString();
    const updatedColumns = project.columns.map(c =>
        c.id === columnId ? { ...c, title, updatedAt: now } : c
    );
    await updateProjectData(project.id, { columns: updatedColumns });
    setToastMessage({
      id: 'column-updated',
      title: 'Column updated',
      description: `${title.trim()}'s title updated successfully!`,
      variant: 'default',
    });
  };
  
  const updateProjectName = async (projectId: string, newName: string) => {
    if (!projectId || !newName.trim()) return;

    try {
      await updateProjectData(projectId, { name: newName.trim() });
      setToastMessage({
        id: 'project-updated',
        title: 'Project updated',
        description: `${newName.trim()}'s name updated successfully!`,
        variant: 'default',
      });
    } catch (error) {
      console.error("Error updating project name:", error);
      setToastMessage({
        id: 'project-update-error',
        title: 'Project update failed',
        description: `Couldn't update project name. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const updateTask = async (taskId: string, columnId: string, updatedData: Partial<Omit<Task, 'id'>>) => {
    const project = getActiveProject();
    const updatedColumns = project.columns.map(c => {
        if (c.id === columnId) {
            const updatedTasks = c.tasks.map(t =>
                t.id === taskId ? { ...t, ...updatedData, updatedAt: new Date().toISOString() } : t
            );
            return { ...c, tasks: updatedTasks, updatedAt: new Date().toISOString() };
        }
        return c;
    });
    await updateProjectData(project.id, { columns: updatedColumns });
    setToastMessage({
      id: 'task-updated',
      title: 'Task updated',
      description: `${updatedData.title?.trim()}'s info updated successfully!`,
      variant: 'default',
    });
  };

  const deleteTask = async (taskId: string, columnId: string) => {
    const project = getActiveProject();
    const task = project.columns.flatMap(c => c.tasks).find(t => t.id === taskId);
    if (!task) return;
    const updatedColumns = project.columns.map(c =>
        c.id === columnId
            ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId), updatedAt: new Date().toISOString() }
            : c
    );
    await updateProjectData(project.id, { columns: updatedColumns });
    setToastMessage({
      id: 'task-deleted',
      title: 'Task deleted',
      description: `Task ${task.title.trim()} deleted successfully!`,
      variant: 'default',
    });
  };

  const deleteColumn = async (projectId: string, columnId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error("Project not found");
    const column = project.columns.find(c => c.id === columnId);
    if (!column) return;
    const updatedColumns = project.columns.filter(c => c.id !== columnId);
    await updateProjectData(project.id, { columns: updatedColumns });
    setToastMessage({
      id: 'column-deleted',
      title: 'Column deleted',
      description: `Column ${column.title.trim()} deleted successfully!`,
      variant: 'default',
    });
  };

  const deleteProject = async (projectId: string) => {
    const project = getProjectById(projectId);
    if (!project) return;
    const projectRef = getProjectDoc(projectId);
    await deleteDoc(projectRef);
    if(activeProjectId === projectId) {
        selectProject(projects.length > 1 ? projects.filter(p=>p.id !== projectId)[0].id : null);
    }
    setToastMessage({
      id: 'project-deleted',
      title: 'Project deleted',
      description: `Project ${project.name.trim()} deleted successfully!`,
      variant: 'default',
    });
  };

  const inviteUserToProject = async (projectId: string, email: string) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { success: false, message: "User not found." };
    }
    
    const userToInvite = querySnapshot.docs[0].data() as KanbanUser;
    
    await updateProjectData(projectId, {
        members: arrayUnion(userToInvite.uid) as any
    });
    
    return { success: true, message: `User ${email} invited.` };
  };
  
  const getProjectMembers = async (projectId: string): Promise<KanbanUser[]> => {
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.members) return [];

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', 'in', project.members));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.data() as KanbanUser);
  };
  
  const removeUserFromProject = async (projectId: string, userId: string) => {
    const project = getProjectById(projectId);
    await updateProjectData(projectId, {
        members: arrayRemove(userId) as any
    });
    setToastMessage({
        id: 'user-removed',
        title: 'User removed',
        description: `User ${userId} removed from project ${project?.name.trim()} successfully!`,
        variant: 'default',
    });
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  return { 
    projects, activeProjectId, setActiveProjectId: selectProject, addProject, addColumn, addTask, 
    moveTask, isLoaded, activeProject, updateColumnTitle, moveColumn, updateProjectName, 
    updateTask, deleteTask, deleteColumn, deleteProject, inviteUserToProject, getProjectMembers, removeUserFromProject
  };
}
