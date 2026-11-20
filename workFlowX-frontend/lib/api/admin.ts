import { api } from '../api-client'
import type {
  AdminStatsResponse,
  AdminUsersListResponse,
  AdminUserDetailsResponse,
  MessageResponse,
  UserEntity,
} from '../types'

export interface AdminUsersQueryParams {
  search?: string
  role?: string
  page?: number
  limit?: number
}

export const adminApi = {
  getStats: (): Promise<AdminStatsResponse> => {
    return api.get<AdminStatsResponse>('/api/v1/admin/stats')
  },

  getUsers: (params?: AdminUsersQueryParams): Promise<AdminUsersListResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.search && params.search.trim() !== '') {
      searchParams.set('search', params.search.trim())
    }
    if (params?.role && params.role !== 'all' && params.role.trim() !== '') {
      searchParams.set('role', params.role.trim())
    }
    if (params?.page) {
      searchParams.set('page', String(params.page))
    }
    if (params?.limit) {
      searchParams.set('limit', String(params.limit))
    }

    const queryStr = searchParams.toString()
    const path = `/api/v1/admin/users${queryStr ? `?${queryStr}` : ''}`
    return api.get<AdminUsersListResponse>(path)
  },

  getUserDetails: (id: string): Promise<AdminUserDetailsResponse> => {
    return api.get<AdminUserDetailsResponse>(`/api/v1/admin/users/${encodeURIComponent(id)}`)
  },

  updateUserRole: (
    id: string,
    role: 'user' | 'admin'
  ): Promise<{ status: string; message: string; data: { user: UserEntity } }> => {
    return api.patch<{ status: string; message: string; data: { user: UserEntity } }>(
      `/api/v1/admin/users/${encodeURIComponent(id)}/role`,
      { role }
    )
  },

  deleteUser: (id: string): Promise<MessageResponse> => {
    return api.delete<MessageResponse>(`/api/v1/admin/users/${encodeURIComponent(id)}`)
  },
}

