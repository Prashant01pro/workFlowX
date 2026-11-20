import { api } from '../api-client'
import type { TaskEntity, TasksListResponse, TaskDetailResponse, MessageResponse } from '../types'

export interface CreateTaskPayload {
  title: string
  description?: string
  status?: 'todo' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  project?: string | null
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  status?: 'todo' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string | null
  project?: string | null
}

export interface TaskQueryParams {
  status?: string
  priority?: string
  project?: string
  search?: string
  sort?: string
  page?: number
  limit?: number
}

export const tasksApi = {
  getAll: (params?: TaskQueryParams): Promise<TasksListResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.status && params.status !== 'all' && params.status !== 'All statuses') {
      const s = params.status.toLowerCase().replace(' ', '_')
      searchParams.set('status', s === 'to_do' ? 'todo' : s)
    }
    if (params?.priority && params.priority !== 'all' && params.priority !== 'All priorities') {
      searchParams.set('priority', params.priority.toLowerCase())
    }
    if (params?.project && params.project !== 'all' && params.project !== 'All projects') {
      searchParams.set('project', params.project)
    }
    if (params?.search) searchParams.set('search', params.search)
    if (params?.sort) searchParams.set('sort', params.sort)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const query = searchParams.toString()
    return api.get<TasksListResponse>(`/api/v1/tasks${query ? `?${query}` : ''}`)
  },

  getById: (id: string): Promise<TaskDetailResponse> => {
    return api.get<TaskDetailResponse>(`/api/v1/tasks/${encodeURIComponent(id)}`)
  },

  create: (payload: CreateTaskPayload): Promise<TaskDetailResponse> => {
    return api.post<TaskDetailResponse>('/api/v1/tasks', payload)
  },

  update: (id: string, payload: UpdateTaskPayload): Promise<TaskDetailResponse> => {
    return api.patch<TaskDetailResponse>(`/api/v1/tasks/${encodeURIComponent(id)}`, payload)
  },

  delete: (id: string): Promise<MessageResponse> => {
    return api.delete<MessageResponse>(`/api/v1/tasks/${encodeURIComponent(id)}`)
  },
}

