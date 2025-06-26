"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Project, Column, Task, KanbanUser } from '@/types/kanban';
import { useAuth } from './use-auth';
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

export type KanbanStore = {
  projects: Project[];
  activeProjectId: string | null;
  isLoaded: boolean;
  activeProject: Project | undefined;
  addProject: (name: string) => Promise<void>;
  setActiveProjectId: (id: string | null) => void;
  addColumn: (title: string) => Promise<void>;
  addTask: (columnId: string, taskData: Omit<Task, 'id'>) => Promise<void>;
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => Promise<void>;
  updateColumnTitle: (columnId: string, title: string) => Promise<void>;
  moveColumn: (draggedColumnId: string, targetColumnId: string) => Promise<void>;
  updateProjectName: (projectId: string, newName: string) => Promise<void>;
  updateTask: (taskId: string, columnId: string, updatedData: Partial<Omit<Task, 'id'>>) => Promise<void>;
  deleteTask: (taskId: string, columnId: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  inviteUserToProject: (projectId: string, email: string) => Promise<{ success: boolean; message: string }>;
  getProjectMembers: (projectId: string) => Promise<KanbanUser[]>;
  removeUserFromProject: (projectId: string, userId: string) => Promise<void>;
};

// This store is now a placeholder until the user logs in
export function useKanbanStore(): KanbanStore {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
      
      if (userProjects.length > 0) {
        if (!activeProjectId || !userProjects.some(p => p.id === activeProjectId)) {
          setActiveProjectId(userProjects[0].id);
        }
      } else {
        setActiveProjectId(null);
      }
      setIsLoaded(true);
    }, (error) => {
        console.error("Error fetching projects:", error);
        setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [user, activeProjectId]);

  const getProjectDoc = useCallback((projectId: string | null) => {
      if (!projectId) throw new Error("No active project");
      return doc(db, 'projects', projectId);
  }, []);

  const getActiveProject = useCallback(() => {
    const project = projects.find(p => p.id === activeProjectId);
    if (!project) throw new Error("Active project not found");
    return project;
  }, [projects, activeProjectId]);

  const addProject = async (name: string) => {
    if (!user) return;
    const newProjectData: Omit<Project, 'id'> = {
      name,
      ownerId: user.uid,
      members: [user.uid],
      columns: [
        { id: `col-${Date.now()}-1`, title: 'To Do', tasks: [] },
        { id: `col-${Date.now()}-2`, title: 'In Progress', tasks: [] },
        { id: `col-${Date.now()}-3`, title: 'Done', tasks: [] },
      ],
    };
    const docRef = await addDoc(collection(db, 'projects'), newProjectData);
    setActiveProjectId(docRef.id);
  };

  const addColumn = async (title: string) => {
    const project = getActiveProject();
    const newColumn: Column = { id: `col-${Date.now()}`, title, tasks: [] };
    const projectRef = getProjectDoc(activeProjectId);
    await updateDoc(projectRef, {
      columns: [...project.columns, newColumn]
    });
  };

  const updateProjectInDb = async (updatedProject: Project) => {
      const { id, ...projectData } = updatedProject;
      const projectRef = getProjectDoc(id);
      await updateDoc(projectRef, projectData as any);
  }
  
  const addTask = async (columnId: string, taskData: Omit<Task, 'id'>) => {
    const project = getActiveProject();
    const newTask: Task = { ...taskData, id: `task-${Date.now()}` };
    const updatedColumns = project.columns.map(c => 
        c.id === columnId ? { ...c, tasks: [...c.tasks, newTask] } : c
    );
    await updateProjectInDb({ ...project, columns: updatedColumns });
  };
  
  const moveTask = async (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => {
    let project = getActiveProject();
    const task = project.columns.flatMap(c => c.tasks).find(t => t.id === taskId);
    if (!task) return;

    let newColumns = JSON.parse(JSON.stringify(project.columns));
    
    const sourceCol = newColumns.find((c: Column) => c.id === fromColumnId);
    if(sourceCol) sourceCol.tasks = sourceCol.tasks.filter((t: Task) => t.id !== taskId);

    const destCol = newColumns.find((c: Column) => c.id === toColumnId);
    if(destCol) destCol.tasks.splice(toIndex, 0, task);
    
    await updateProjectInDb({ ...project, columns: newColumns });
  };

  const moveColumn = async (draggedColumnId: string, targetColumnId: string) => {
    if (draggedColumnId === targetColumnId) return;
    const project = getActiveProject();
    const columns = [...project.columns];
    const draggedIndex = columns.findIndex(c => c.id === draggedColumnId);
    const targetIndex = columns.findIndex(c => c.id === targetColumnId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedColumn] = columns.splice(draggedIndex, 1);
    columns.splice(targetIndex, 0, draggedColumn);
    await updateProjectInDb({ ...project, columns });
  };
  
  const updateColumnTitle = async (columnId: string, title: string) => {
    const project = getActiveProject();
    const updatedColumns = project.columns.map(c =>
        c.id === columnId ? { ...c, title } : c
    );
    await updateProjectInDb({ ...project, columns: updatedColumns });
  };
  
  const updateProjectName = async (projectId: string, newName: string) => {
    if (!projectId || !newName.trim()) return;
    const projectRef = getProjectDoc(projectId);
    await updateDoc(projectRef, { name: newName.trim() });
  };

  const updateTask = async (taskId: string, columnId: string, updatedData: Partial<Omit<Task, 'id'>>) => {
    const project = getActiveProject();
    const updatedColumns = project.columns.map(c => {
        if (c.id === columnId) {
            const updatedTasks = c.tasks.map(t =>
                t.id === taskId ? { ...t, ...updatedData } : t
            );
            return { ...c, tasks: updatedTasks };
        }
        return c;
    });
    await updateProjectInDb({ ...project, columns: updatedColumns });
  };

  const deleteTask = async (taskId: string, columnId: string) => {
    const project = getActiveProject();
    const updatedColumns = project.columns.map(c =>
        c.id === columnId
            ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) }
            : c
    );
    await updateProjectInDb({ ...project, columns: updatedColumns });
  };

  const deleteColumn = async (columnId: string) => {
    const project = getActiveProject();
    const updatedColumns = project.columns.filter(c => c.id !== columnId);
    await updateProjectInDb({ ...project, columns: updatedColumns });
  };

  const deleteProject = async (projectId: string) => {
    const projectRef = getProjectDoc(projectId);
    await deleteDoc(projectRef);
    if(activeProjectId === projectId) {
        setActiveProjectId(projects.length > 1 ? projects.filter(p=>p.id !== projectId)[0].id : null);
    }
  };

  const inviteUserToProject = async (projectId: string, email: string) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { success: false, message: "User not found." };
    }
    
    const userToInvite = querySnapshot.docs[0].data() as KanbanUser;
    const projectRef = getProjectDoc(projectId);
    
    await updateDoc(projectRef, {
        members: arrayUnion(userToInvite.uid)
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
    const projectRef = getProjectDoc(projectId);
    await updateDoc(projectRef, {
        members: arrayRemove(userId)
    });
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  return { 
    projects, activeProjectId, setActiveProjectId, addProject, addColumn, addTask, 
    moveTask, isLoaded, activeProject, updateColumnTitle, moveColumn, updateProjectName, 
    updateTask, deleteTask, deleteColumn, deleteProject, inviteUserToProject, getProjectMembers, removeUserFromProject
  };
}
