"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Project, Column, Task } from '@/types/kanban';
import { ToasterToast, useToast } from "@/hooks/use-toast";

const KANBAN_STORAGE_KEY = 'openkanban-data';

const initialData: Project[] = [
  {
    id: 'proj-1',
    name: 'My First Project',
    columns: [
      {
        id: 'col-1',
        title: 'To Do',
        tasks: [
          { id: 'task-1', title: 'Create a new project', description: 'Use the project manager to add a new project to your workspace.', assignee: 'A' },
          { id: 'task-2', title: 'Add a new column', description: 'Customize your workflow by adding a new column to the board.', assignee: 'B' },
        ],
      },
      {
        id: 'col-2',
        title: 'In Progress',
        tasks: [
          { id: 'task-3', title: 'Drag and drop tasks', description: 'Move this task to the "Done" column to mark it as complete.', assignee: 'C' },
        ],
      },
      {
        id: 'col-3',
        title: 'Done',
        tasks: [
          { id: 'task-4', title: 'Explore OpenKanban', description: 'Welcome to your new Kanban board!', assignee: 'A' },
        ],
      },
    ],
  },
];

export type KanbanStore = {
  projects: Project[];
  activeProjectId: string | null;
  isLoaded: boolean;
  activeProject: Project | undefined;
  addProject: (name: string) => void;
  setActiveProjectId: (id: string | null) => void;
  addColumn: (title: string) => void;
  addTask: (columnId: string, taskData: Omit<Task, 'id'>) => void;
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => void;
  setProjects: (projects: Project[]) => void;
  updateColumnTitle: (columnId: string, title: string) => void;
  moveColumn: (draggedColumnId: string, targetColumnId: string) => void;
  updateProjectName: (projectId: string, newName: string) => void;
  deleteProject: (id: string) => void;
  updateTask: (taskId: string, columnId: string, updatedData: Partial<Omit<Task, 'id'>>) => void;
  deleteTask: (taskId: string, columnId: string) => void;
  deleteColumn: (columnId: string) => void;
};

function getActiveProjectName(projects: Project[], activeProjectId: string | null) {
  const activeProject = projects.find(project => project.id === activeProjectId);
  return activeProject?.name || 'none';
}

export function useKanbanStore(): KanbanStore {
  const [projects, setProjectsState] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toastInfo, setToastInfo] = useState<ToasterToast | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (toastInfo) {
      toast(toastInfo);
      setToastInfo(null);
    }
  }, [toastInfo, toast]);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(KANBAN_STORAGE_KEY);
      if (storedData) {
        const { projects: storedProjects, activeProjectId: storedActiveId } = JSON.parse(storedData);
        setProjectsState(storedProjects || initialData);
        setActiveProjectIdState(storedActiveId || (storedProjects && storedProjects.length > 0 ? storedProjects[0].id : initialData[0].id));
      } else {
        setProjectsState(initialData);
        setActiveProjectIdState(initialData[0]?.id || null);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setProjectsState(initialData);
      setActiveProjectIdState(initialData[0]?.id || null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveData = useCallback((projectsData: Project[], activeId: string | null) => {
    if (isLoaded) {
      try {
        const dataToStore = JSON.stringify({ projects: projectsData, activeProjectId: activeId });
        localStorage.setItem(KANBAN_STORAGE_KEY, dataToStore);
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
        setToastInfo({
          id: 'data-save-failed',
          title: 'Data save failed',
          description: 'The data could not be saved to localStorage.',
          variant: 'destructive',
        });
      }
    }
  }, [isLoaded]);

  const setProjects = useCallback((newProjects: Project[] | ((p:Project[])=>Project[])) => {
    setProjectsState(prevProjects => {
        const updatedProjects = typeof newProjects === 'function' ? newProjects(prevProjects) : newProjects;
        saveData(updatedProjects, activeProjectId);
        return updatedProjects;
    });
  }, [activeProjectId, saveData]);

  const setActiveProjectId = useCallback((id: string | null) => {
    setActiveProjectIdState(id);
    saveData(projects, id);
    setToastInfo({
      id: 'project-changed',
      title: 'Project changed',
      description: `The active project has been changed to ${getActiveProjectName(projects, id)} successfully.`,
      variant: 'default',
    });
  }, [projects, saveData]);

  const addProject = (name: string) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      columns: [
        { id: `col-${Date.now()}-1`, title: 'To Do', tasks: [] },
        { id: `col-${Date.now()}-2`, title: 'In Progress', tasks: [] },
        { id: `col-${Date.now()}-3`, title: 'Done', tasks: [] },
      ],
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setToastInfo({
      id: 'project-added',
      title: 'Project added',
      description: `The project ${newProject.name} has been added successfully.`,
      variant: 'default',
    });
  };
  
  const addColumn = (title: string) => {
      if (!activeProjectId) return;
      const newColumn: Column = { id: `col-${Date.now()}`, title, tasks: [] };
      setProjects(prev => prev.map(p => 
          p.id === activeProjectId ? { ...p, columns: [...p.columns, newColumn] } : p
      ));
      setToastInfo({
        id: 'column-added',
        title: 'Column added',
        description: `The column ${newColumn.title} has been added successfully.`,
        variant: 'default',
      });
  };

  const addTask = (columnId: string, taskData: Omit<Task, 'id'>) => {
      if (!activeProjectId) return;
      const newTask: Task = { ...taskData, id: `task-${Date.now()}` };
      setProjects(prev => prev.map(p => {
          if (p.id === activeProjectId) {
              const updatedColumns = p.columns.map(c => 
                  c.id === columnId ? { ...c, tasks: [...c.tasks, newTask] } : c
              );
              return { ...p, columns: updatedColumns };
          }
          return p;
      }));
      setToastInfo({
        id: 'task-added',
        title: 'Task added',
        description: `The task ${newTask.title} has been added successfully.`,
        variant: 'default',
      });
  };

  const moveTask = (taskId: string, fromColumnId: string, toColumnId: string, toIndex: number) => {
      if (!activeProjectId) return;
      
      setProjects(prev => {
        const project = prev.find(p => p.id === activeProjectId);
        if (!project) return prev;

        const task = project.columns.flatMap(c => c.tasks).find(t => t.id === taskId);
        if (!task) return prev;

        const newProject = JSON.parse(JSON.stringify(project));
        
        const sourceCol = newProject.columns.find((c: Column) => c.id === fromColumnId);
        if (sourceCol) {
            sourceCol.tasks = sourceCol.tasks.filter((t: Task) => t.id !== taskId);
        }

        const destCol = newProject.columns.find((c: Column) => c.id === toColumnId);
        if (destCol) {
            destCol.tasks.splice(toIndex, 0, task);
        }

        setToastInfo({
          id: 'task-moved',
          title: 'Task moved',
          description: `The task ${task.title} has been moved to ${destCol?.title} state successfully.`,
          variant: 'default',
        });

        return prev.map(p => p.id === activeProjectId ? newProject : p);
      });
  };

  const moveColumn = (draggedColumnId: string, targetColumnId: string) => {
    if (!activeProjectId || draggedColumnId === targetColumnId) return;

    setProjects(prev => {
      const projectIndex = prev.findIndex(p => p.id === activeProjectId);
      if (projectIndex === -1) {
        return prev;
      }

      const project = prev[projectIndex];
      const columns = [...project.columns];
      
      const draggedIndex = columns.findIndex(c => c.id === draggedColumnId);
      const targetIndex = columns.findIndex(c => c.id === targetColumnId);

      if (draggedIndex === -1 || targetIndex === -1) {
        return prev;
      }

      const [draggedColumn] = columns.splice(draggedIndex, 1);
      columns.splice(targetIndex, 0, draggedColumn);
      
      const newProjects = [...prev];
      newProjects[projectIndex] = { ...project, columns };

      setToastInfo({
        id: 'column-moved',
        title: 'Column moved',
        description: `The column ${draggedColumn.title} has been moved to ${targetIndex + 1} position successfully.`,
        variant: 'default',
      });

      return newProjects;
    });
  };

  const updateColumnTitle = (columnId: string, title: string) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const updatedColumns = p.columns.map(c =>
          c.id === columnId ? { ...c, title } : c
        );
        return { ...p, columns: updatedColumns };
      }
      return p;
    }));
    setToastInfo({
      id: 'column-title-updated',
      title: 'Column title updated',
      description: `The column ${title} has been updated successfully.`,
      variant: 'default',
    });
  };

  const updateProjectName = (projectId: string, newName: string) => {
    if (!projectId || !newName.trim()) return;
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, name: newName.trim() } : p
    ));
    setToastInfo({
      id: 'project-name-updated',
      title: 'Project name updated',
      description: `The project ${newName.trim()} has been updated successfully.`,
      variant: 'default',
    });
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  const deleteProject = (projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    const newActiveId = activeProjectId === projectId 
      ? (updatedProjects[0]?.id || null) 
      : activeProjectId;
    
    setProjectsState(updatedProjects);
    setActiveProjectIdState(newActiveId);
    saveData(updatedProjects, newActiveId);
    setToastInfo({
      id: 'project-deleted',
      title: 'Project deleted',
      description: `The project ${getActiveProjectName(projects, activeProjectId)} has been deleted successfully.`,
      variant: 'default',
    });
  };

  const updateTask = (taskId: string, columnId: string, updatedData: Partial<Omit<Task, 'id'>>) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const updatedColumns = p.columns.map(c => {
          if (c.id === columnId) {
            const updatedTasks = c.tasks.map(t =>
              t.id === taskId ? { ...t, ...updatedData } : t
            );
            return { ...c, tasks: updatedTasks };
          }
          return c;
        });
        return { ...p, columns: updatedColumns };
      }
      return p;
    }));
    setToastInfo({
      id: 'task-updated',
      title: 'Task updated',
      description: `The task ${updatedData.title} has been updated successfully.`,
      variant: 'default',
    });
  };

  const deleteTask = (taskId: string, columnId: string) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const updatedColumns = p.columns.map(c =>
          c.id === columnId
            ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) }
            : c
        );
        return { ...p, columns: updatedColumns };
      }
      return p;
    }));
    setToastInfo({
      id: 'task-deleted',
      title: 'Task deleted',
      description: `The task  has been deleted successfully.`,
      variant: 'default',
    });
  };

  const deleteColumn = (columnId: string) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const updatedColumns = p.columns.filter(c => c.id !== columnId);
        return { ...p, columns: updatedColumns };
      }
      return p;
    }));
    setToastInfo({
      id: 'column-deleted',
      title: 'Column deleted',
      description: `The column has been deleted successfully.`,
      variant: 'default',
    });
  };  

  return { projects, activeProjectId, setActiveProjectId, addProject, addColumn, addTask, moveTask, isLoaded, activeProject, setProjects, updateColumnTitle, moveColumn, updateProjectName, deleteProject, deleteTask, updateTask, deleteColumn };
}
