export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  priority?: 'Urgent' | 'High' | 'Medium' | 'Low';
  createdAt: string;
  updatedAt: string;
  deadline?: string;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  columns: Column[];
  ownerId: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KanbanUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}
