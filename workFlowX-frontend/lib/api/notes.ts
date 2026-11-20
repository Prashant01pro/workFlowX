import { api } from '../api-client'
import type { NoteEntity, NotesListResponse, NoteDetailResponse, MessageResponse } from '../types'

export interface CreateNotePayload {
  title: string
  content: string
  tags?: string[]
  isPinned?: boolean
  project?: string | null
}

export interface UpdateNotePayload {
  title?: string
  content?: string
  tags?: string[]
  isPinned?: boolean
  project?: string | null
}

export interface NoteQueryParams {
  project?: string
  isPinned?: boolean
  tag?: string
  search?: string
  sort?: string
  page?: number
  limit?: number
}

export const notesApi = {
  getAll: (params?: NoteQueryParams): Promise<NotesListResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.project) searchParams.set('project', params.project)
    if (params?.isPinned !== undefined) searchParams.set('isPinned', String(params.isPinned))
    if (params?.tag) searchParams.set('tag', params.tag)
    if (params?.search) searchParams.set('search', params.search)
    if (params?.sort) searchParams.set('sort', params.sort)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const query = searchParams.toString()
    return api.get<NotesListResponse>(`/api/v1/notes${query ? `?${query}` : ''}`)
  },

  getById: (id: string): Promise<NoteDetailResponse> => {
    return api.get<NoteDetailResponse>(`/api/v1/notes/${encodeURIComponent(id)}`)
  },

  create: (payload: CreateNotePayload): Promise<NoteDetailResponse> => {
    return api.post<NoteDetailResponse>('/api/v1/notes', payload)
  },

  update: (id: string, payload: UpdateNotePayload): Promise<NoteDetailResponse> => {
    return api.patch<NoteDetailResponse>(`/api/v1/notes/${encodeURIComponent(id)}`, payload)
  },

  delete: (id: string): Promise<MessageResponse> => {
    return api.delete<MessageResponse>(`/api/v1/notes/${encodeURIComponent(id)}`)
  },
}

