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
}
