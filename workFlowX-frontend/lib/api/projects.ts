import { api } from '../api-client'
import type { ProjectEntity, ProjectsListResponse, ProjectDetailResponse, MessageResponse } from '../types'

export interface CreateProjectPayload {
  title: string
  description: string
  status?: 'active' | 'paused' | 'completed' | 'archived'
  deadline: string
  techStack?: string[]
  nonTechStack?: string[]
}

export interface UpdateProjectPayload {
  title?: string
  description?: string
  status?: 'active' | 'paused' | 'completed' | 'archived'
  deadline?: string
  techStack?: string[]
  nonTechStack?: string[]
}

export interface ProjectQueryParams {
  status?: string
  search?: string
  sort?: string
  page?: number
  limit?: number
}

export const projectsApi = {
  getAll: (params?: ProjectQueryParams): Promise<ProjectsListResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.status && params.status !== 'all' && params.status !== 'All projects') {
      searchParams.set('status', params.status.toLowerCase())
    }
    if (params?.search) searchParams.set('search', params.search)
    if (params?.sort) searchParams.set('sort', params.sort)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const query = searchParams.toString()
    return api.get<ProjectsListResponse>(`/api/v1/projects${query ? `?${query}` : ''}`)
  },

  getById: (id: string): Promise<ProjectDetailResponse> => {
    return api.get<ProjectDetailResponse>(`/api/v1/projects/${encodeURIComponent(id)}`)
  },

  create: (payload: CreateProjectPayload): Promise<ProjectDetailResponse> => {
    return api.post<ProjectDetailResponse>('/api/v1/projects', payload)
  },

  update: (id: string, payload: UpdateProjectPayload): Promise<ProjectDetailResponse> => {
    return api.patch<ProjectDetailResponse>(`/api/v1/projects/${encodeURIComponent(id)}`, payload)
  },

  delete: (id: string): Promise<MessageResponse> => {
    return api.delete<MessageResponse>(`/api/v1/projects/${encodeURIComponent(id)}`)
  },
}

