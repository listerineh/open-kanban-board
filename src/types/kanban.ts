export interface Notification {
  id: string;
  userId: string;
  text: string;
  link: string;
  read: boolean;
  createdAt: string;
  actions?: {
    accept: { projectId: string; invitationId: string };
    decline: { projectId: string; invitationId: string };
  };
}

export interface Invitation {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  invitedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  columnId: string;
  order: number;
  title: string;
  description?: string;
  assigneeIds?: string[];
  priority?: 'Urgent' | 'High' | 'Medium' | 'Low';
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  completedAt?: string | null;
  parentId?: string;
  labelIds?: string[];
  activity?: Activity[];
  isArchived?: boolean;
}

export interface Activity {
  id: string;
  text: string;
  timestamp: string;
  userId: string;
  type: 'log' | 'comment';
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Column {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  columns: Omit<Column, 'tasks'>[];
  ownerId: string;
  description?: string;
  members: string[];
  pendingMembers?: Invitation[];
  createdAt: string;
  updatedAt: string;
  enableSubtasks?: boolean;
  enableDeadlines?: boolean;
  enableLabels?: boolean;
  enableDashboard?: boolean;
  labels?: Label[];
  autoArchivePeriod?: '1-day' | '1-week' | '1-month' | 'never';
}

export interface KanbanUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type OtherUserPresence = {
  uid: string;
  displayName: string;
  photoURL: string;
  theme: string;
  cursor: { x: number; y: number } | null;
};
