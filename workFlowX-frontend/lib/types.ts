/**
 * WorkFlowX Shared API Response and Entity Types
 * Generic and flexible enough to support actual backend response formats
 * without forcing uniform envelopes.
 */

// 1. Common Response Envelope Patterns

export interface StandardDataResponse<T> {
  status: 'success';
  data: T;
  message?: string;
}

export interface PaginationMeta {
  totalProjects?: number;
  totalTasks?: number;
  totalNotes?: number;
  totalTransactions?: number;
  totalUsers?: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface MessageResponse {
  message: string;
  status?: string;
}

export interface HealthResponse {
  message: string;
}

// 2. Authentication & User Profile Types

export interface UserEntity {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  bio?: string;
  role?: 'user' | 'admin' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSuccessResponse {
  message: string;
  accessToken: string;
  sessionId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TokenRefreshResponse {
  newAccessToken: string;
  message: string;
}

export interface ProfileResponse {
  user: UserEntity;
}

export interface UserMeResponse {
  id: string;
  name: string;
  email: string;
}

export interface DeviceSession {
  sessionId: string;
  userId?: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    ip?: string;
  };
  createdAt?: string;
  lastActive?: string;
  isCurrentDevice?: boolean;
}

export interface ActiveSessionsResponse {
  sessions: DeviceSession[];
}

// 3. Workspace Entities & Resource Collections

export interface ProjectEntity {
  _id: string;
  title: string;
  description: string;
  techStack?: string[];
  nonTechStack?: string[];
  status: 'active' | 'paused' | 'completed' | 'archived';
  deadline: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsListResponse {
  status: 'success';
  projects: ProjectEntity[];
  pagination: PaginationMeta;
}

export interface ProjectDetailResponse {
  status: 'success';
  data: {
    project: ProjectEntity;
  };
  message?: string;
}

export interface TaskEntity {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  project?: { _id: string; title: string; status: string } | string | null;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface TasksListResponse {
  status: 'success';
  tasks: TaskEntity[];
  pagination: PaginationMeta;
}

export interface TaskDetailResponse {
  status: 'success';
  data: {
    task: TaskEntity;
  };
  message?: string;
}

export interface NoteEntity {
  _id: string;
  title: string;
  content: string;
  tags?: string[];
  isPinned?: boolean;
  project?: { _id: string; title: string; status: string } | string | null;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotesListResponse {
  status: 'success';
  notes: NoteEntity[];
  pagination: PaginationMeta;
}

export interface NoteDetailResponse {
  status: 'success';
  data: {
    note: NoteEntity;
  };
  message?: string;
}

export interface TransactionEntity {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  project?: { _id: string; title: string; status: string } | string | null;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionsListResponse {
  status: 'success';
  transactions: TransactionEntity[];
  pagination: PaginationMeta;
}

export interface TransactionDetailResponse {
  status: 'success';
  data: {
    transaction: TransactionEntity;
  };
  message?: string;
}

export interface FinancialSummaryData {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  categoryBreakdown: Array<{
    _id: string;
    totalSpent: number;
    count: number;
  }>;
}

export interface FinancialSummaryResponse {
  status: 'success';
  data: FinancialSummaryData;
}

// 4. Dashboard Analytics Types

export interface DashboardStatsData {
  projects: {
    total: number;
    active: number;
    completed: number;
    paused: number;
    archived: number;
  };
  tasks: {
    total: number;
    todo: number;
    in_progress: number;
    completed: number;
    overdue: number;
  };
  notes: {
    total: number;
    pinned: number;
  };
  finances: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  };
  upcomingTasks: TaskEntity[];
  recentProjects?: ProjectEntity[];
  recentNotes?: NoteEntity[];
}

export interface DashboardResponse {
  status: 'success';
  data: DashboardStatsData;
}

// 5. Admin RBAC Types

export interface AdminSystemStatsData {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  totalNotes: number;
  totalTransactions: number;
  totalPlatformVolume: number;
}

export interface AdminStatsResponse {
  status: 'success';
  data: AdminSystemStatsData;
}

export interface AdminUsersListResponse {
  status: 'success';
  users: UserEntity[];
  pagination: {
    totalUsers: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export interface AdminUserDetailsData {
  user: UserEntity;
  resourceSummary: {
    projectsCount: number;
    tasksCount: number;
    notesCount: number;
    transactionsCount: number;
  };
}

export interface AdminUserDetailsResponse {
  status: 'success';
  data: AdminUserDetailsData;
}

// 6. Generic API Error Format

export interface ApiErrorPayload {
  status?: string;
  statusCode?: number;
  message?: string;
  error?: string;
  issues?: Array<{ message: string; path?: Array<string | number> }>;
}

// 7. Notification System Types

export type NotificationPriority = 'info' | 'warning' | 'critical';

export type NotificationType =
  | 'PROJECT_DEADLINE_APPROACHING'
  | 'PROJECT_OVERDUE'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'NOTE_REMINDER'
  | 'FINANCE_LARGE_EXPENSE'
  | 'FINANCE_LIMIT_REACHED'
  | 'SYSTEM';

export interface NotificationEntity {
  _id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: {
    projectId?: string;
    taskId?: string;
    noteId?: string;
    transactionId?: string;
    daysRemaining?: number;
    amount?: number;
    [key: string]: unknown;
  };
  readAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationsListResponse {
  status: 'success';
  notifications: NotificationEntity[];
  total: number;
  unreadCount: number;
  page: number;
  pages: number;
}

export interface UnreadCountResponse {
  status: 'success';
  unreadCount: number;
}

export interface EvaluateAlertsResponse {
  status: 'success';
  message: string;
  unreadCount: number;
}

export interface SingleNotificationResponse {
  status: 'success';
  message?: string;
  data: NotificationEntity;
}

export interface MarkAllReadResponse {
  status: 'success';
  message: string;
  modifiedCount: number;
}

