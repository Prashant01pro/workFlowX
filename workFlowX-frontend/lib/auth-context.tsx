'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api, onAuthFailure, setAccessToken } from './api-client'
import type { AuthSuccessResponse, ProfileResponse } from './types'

export interface User {
  id: string
  name: string
  email: string
  bio?: string
  role?: 'user' | 'admin' | string
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { email: string; password: string }) => Promise<User>
  register: (data: { name: string; email: string; password: string; bio?: string }) => Promise<User>
  logout: () => Promise<void>
  refreshSession: () => Promise<User | null>
  updateUser: (updated: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id || raw._id || ''),
    name: String(raw.name || ''),
    email: String(raw.email || ''),
    bio: raw.bio ? String(raw.bio) : undefined,
    role: raw.role ? String(raw.role) : 'user',
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshSession = useCallback(async (): Promise<User | null> => {
    try {
      // /api/v1/auth/profile returns { user: UserEntity } with role, bio, name, email
      const res = await api.get<ProfileResponse>('/api/v1/auth/profile')
      if (res && res.user) {
        const normalized = normalizeUser(res.user as unknown as Record<string, unknown>)
        setUser(normalized)
        return normalized
      }
      setUser(null)
      return null
    } catch {
      setUser(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Restore session on initial application load
  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  // Listen to background 401 auth failures (e.g. session expired or revoked)
  useEffect(() => {
    const unsubscribe = onAuthFailure(() => {
      setUser(null)
    })
    return () => unsubscribe()
  }, [])

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    const authRes = await api.post<AuthSuccessResponse>('/api/v1/auth/login', credentials)
    if (authRes.accessToken) {
      setAccessToken(authRes.accessToken)
    }
    let loggedInUser: User = {
      id: authRes.user.id,
      name: authRes.user.name,
      email: authRes.user.email,
      role: 'user',
    }

    // Try fetching the full profile to obtain user role and bio
    try {
      const profileRes = await api.get<ProfileResponse>('/api/v1/auth/profile')
      if (profileRes && profileRes.user) {
        loggedInUser = normalizeUser(profileRes.user as unknown as Record<string, unknown>)
      }
    } catch {
      // Fallback to returned login user object
    }

    setUser(loggedInUser)
    return loggedInUser
  }

  const register = async (data: { name: string; email: string; password: string; bio?: string }): Promise<User> => {
    const regRes = await api.post<AuthSuccessResponse>('/api/v1/auth/register', data)
    if (regRes.accessToken) {
      setAccessToken(regRes.accessToken)
    }
    let registeredUser: User = {
      id: regRes.user.id,
      name: regRes.user.name,
      email: regRes.user.email,
      role: 'user',
    }

    try {
      const profileRes = await api.get<ProfileResponse>('/api/v1/auth/profile')
      if (profileRes && profileRes.user) {
        registeredUser = normalizeUser(profileRes.user as unknown as Record<string, unknown>)
      }
    } catch {
      // Fallback
    }

    setUser(registeredUser)
    return registeredUser
  }

  const logout = async (): Promise<void> => {
    try {
      await api.post('/api/v1/auth/logout')
    } catch (err) {
      console.error('Logout error on server:', err)
    } finally {
      setAccessToken(null)
      setUser(null)
      router.push('/login')
    }
  }

  const updateUser = useCallback((updated: Partial<User>) => {
    setUser((curr) => (curr ? { ...curr, ...updated } : null))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshSession,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

