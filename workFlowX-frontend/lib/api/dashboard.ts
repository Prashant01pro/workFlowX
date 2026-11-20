import { api } from '../api-client'
import type { DashboardResponse } from '../types'

export const dashboardApi = {
  getStats: (): Promise<DashboardResponse> => {
    return api.get<DashboardResponse>('/api/v1/dashboard')
  },
}

