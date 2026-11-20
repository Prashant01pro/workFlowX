import { api } from '../api-client'
import type { ActiveSessionsResponse, MessageResponse } from '../types'

export const sessionsApi = {
  getSessions: (): Promise<ActiveSessionsResponse> => {
    return api.get<ActiveSessionsResponse>('/api/v1/auth/sessions')
  },

  revokeSession: (sessionId: string): Promise<MessageResponse> => {
    return api.delete<MessageResponse>(`/api/v1/auth/sessions/${encodeURIComponent(sessionId)}`)
  },

  revokeAllSessions: (): Promise<MessageResponse> => {
    return api.delete<MessageResponse>('/api/v1/auth/sessions')
  },
}

