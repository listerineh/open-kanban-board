export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Project {
  id: string;
  name: string;
  columns: Column[];
  ownerId: string;
  members: string[];
}

export interface KanbanUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}
