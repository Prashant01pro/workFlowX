import { api } from '../api-client'
import type { ProfileResponse, UserEntity } from '../types'

export interface UpdateProfilePayload {
  name?: string
  bio?: string
}

export const profileApi = {
  getProfile: (): Promise<ProfileResponse> => {
    return api.get<ProfileResponse>('/api/v1/auth/profile')
  },

  updateProfile: (payload: UpdateProfilePayload): Promise<{ user: UserEntity }> => {
    return api.patch<{ user: UserEntity }>('/api/v1/auth/update-profile', payload)
  },
}

