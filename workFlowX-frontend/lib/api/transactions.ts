import { api } from '../api-client'
import type {
  TransactionEntity,
  TransactionsListResponse,
  TransactionDetailResponse,
  FinancialSummaryResponse,
  MessageResponse,
} from '../types'

export interface CreateTransactionPayload {
  type: 'income' | 'expense'
  amount: number
  category: string
  description?: string
  date?: string
  project?: string | null
}

export interface UpdateTransactionPayload {
  type?: 'income' | 'expense'
  amount?: number
  category?: string
  description?: string
  date?: string
  project?: string | null
}

export interface TransactionQueryParams {
  type?: 'income' | 'expense' | 'all'
  category?: string
  project?: string
  startDate?: string
  endDate?: string
  search?: string
  sort?: string
  page?: number
  limit?: number
}

export const transactionsApi = {
  getAll: (params?: TransactionQueryParams): Promise<TransactionsListResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.type && params.type !== 'all') {
      searchParams.set('type', params.type.toLowerCase())
    }
    if (params?.category && params.category !== 'all' && params.category.trim() !== '') {
      searchParams.set('category', params.category.trim().toLowerCase())
    }
    if (params?.project && params.project !== 'all' && params.project !== 'All projects') {
      searchParams.set('project', params.project)
    }
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    if (params?.search) searchParams.set('search', params.search)
    if (params?.sort) searchParams.set('sort', params.sort)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))

    const query = searchParams.toString()
    return api.get<TransactionsListResponse>(`/api/v1/transactions${query ? `?${query}` : ''}`)
  },

  getSummary: (params?: { startDate?: string; endDate?: string }): Promise<FinancialSummaryResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    const query = searchParams.toString()
    return api.get<FinancialSummaryResponse>(`/api/v1/transactions/summary${query ? `?${query}` : ''}`)
  },

  getById: (id: string): Promise<TransactionDetailResponse> => {
    return api.get<TransactionDetailResponse>(`/api/v1/transactions/${encodeURIComponent(id)}`)
  },

  create: (payload: CreateTransactionPayload): Promise<TransactionDetailResponse> => {
    return api.post<TransactionDetailResponse>('/api/v1/transactions', payload)
  },

  update: (id: string, payload: UpdateTransactionPayload): Promise<TransactionDetailResponse> => {
    return api.patch<TransactionDetailResponse>(`/api/v1/transactions/${encodeURIComponent(id)}`, payload)
  },

  delete: (id: string): Promise<MessageResponse> => {
    return api.delete<MessageResponse>(`/api/v1/transactions/${encodeURIComponent(id)}`)
  },
}

