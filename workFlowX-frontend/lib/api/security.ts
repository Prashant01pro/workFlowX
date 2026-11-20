import { api } from '../api-client'
import type { MessageResponse } from '../types'

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export const securityApi = {
  changePassword: (payload: ChangePasswordPayload): Promise<MessageResponse> => {
    return api.patch<MessageResponse>('/api/v1/auth/change-password', payload)
  },
}

