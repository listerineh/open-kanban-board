"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Project, Column, Task } from '@/types/kanban';
import { useToast } from "@/hooks/use-toast";

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
};

export function useKanbanStore(): KanbanStore {
  const [projects, setProjectsState] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(KANBAN_STORAGE_KEY);
      if (storedData) {
        const { projects: storedProjects, activeProjectId: storedActiveId } = JSON.parse(storedData);
        setProjectsState(storedProjects || initialData);
        setActiveProjectIdState(storedActiveId || (storedProjects && storedProjects.length > 0 ? storedProjects[0].id : initialData[0].id));
        toast({
          title: 'Data loaded',
          description: 'Data loaded from localStorage',
          variant: 'default',
        });
      } else {
        setProjectsState(initialData);
        setActiveProjectIdState(initialData[0]?.id || null);
        toast({
          title: 'No data found',
          description: 'No data found in localStorage, using default data',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({
        title: 'Failed to load data',
        description: 'Could not load data from localStorage',
        variant: 'destructive',
      });
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
        toast({
          title: 'Data saved',
          description: 'Data saved successfully to localStorage!',
          variant: 'default',
        });
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
        toast({
          title: 'Failed to save data',
          description: 'Could not save data to localStorage',
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
    toast({
      title: 'Project created',
      description: `Project ${newProject.name} created`,
      variant: 'default',
    });
  };
  
  const addColumn = (title: string) => {
      if (!activeProjectId) return;
      const newColumn: Column = { id: `col-${Date.now()}`, title, tasks: [] };
      setProjects(prev => prev.map(p => 
          p.id === activeProjectId ? { ...p, columns: [...p.columns, newColumn] } : p
      ));
      toast({
        title: 'Column created',
        description: `Column ${newColumn.title} created`,
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
      toast({
        title: 'Task created',
        description: `Task ${newTask.title} created`,
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

        toast({
          title: 'Task moved',
          description: `Task ${task.title} moved to ${destCol?.title}`,
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
        toast({
          title: 'Could not move column',
          description: 'Could not move column to target position',
          variant: 'destructive',
        });
        return prev;
      }

      const project = prev[projectIndex];
      const columns = [...project.columns];
      
      const draggedIndex = columns.findIndex(c => c.id === draggedColumnId);
      const targetIndex = columns.findIndex(c => c.id === targetColumnId);

      if (draggedIndex === -1 || targetIndex === -1) {
        toast({
          title: 'Could not move column',
          description: 'Could not move column to target position',
          variant: 'destructive',
        });
        return prev;
      }

      const [draggedColumn] = columns.splice(draggedIndex, 1);
      columns.splice(targetIndex, 0, draggedColumn);
      
      const newProjects = [...prev];
      newProjects[projectIndex] = { ...project, columns };

      toast({
        title: 'Column moved',
        description: `Column ${draggedColumn.title} moved to position ${targetIndex + 1}`,
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
    toast({
      title: 'Column updated',
      description: `Column ${title} updated`,
      variant: 'default',
    });
  };

  const updateProjectName = (projectId: string, newName: string) => {
    if (!projectId || !newName.trim()) return;
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, name: newName.trim() } : p
    ));
    toast({
      title: 'Project updated',
      description: `Project ${newName.trim()} updated`,
      variant: 'default',
    });
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const updatedProjects = prev.filter(p => p.id !== id);
      
      const newActiveId = activeProjectId === id 
        ? (updatedProjects.length > 0 ? updatedProjects[0].id : null)
        : activeProjectId;
        
      saveData(updatedProjects, newActiveId);
      
      if (activeProjectId === id) {
        setActiveProjectIdState(newActiveId);
      }
      
      toast({
        title: 'Project deleted',
        description: 'Project has been successfully deleted',
        variant: 'default',
      });
      
      return updatedProjects;
    });
  }, [activeProjectId, saveData]);

  return { projects, activeProjectId, setActiveProjectId, addProject, addColumn, addTask, moveTask, isLoaded, activeProject, setProjects, updateColumnTitle, moveColumn, updateProjectName, deleteProject };
}
