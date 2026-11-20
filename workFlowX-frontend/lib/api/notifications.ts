import { api, buildApiUrl } from '../api-client'
import type {
  NotificationsListResponse,
  UnreadCountResponse,
  EvaluateAlertsResponse,
  SingleNotificationResponse,
  MarkAllReadResponse,
} from '../types'

export const notificationsApi = {
  /**
   * Fetches user notifications with optional pagination and filtering.
   * Backend automatically runs workspace alert evaluation on call.
   */
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<NotificationsListResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.unreadOnly) searchParams.set('unreadOnly', 'true')
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return api.get<NotificationsListResponse>(`/api/v1/notifications${query}`)
  },

  /**
   * Fast badge counter for unread notifications.
   */
  getUnreadCount: (): Promise<UnreadCountResponse> => {
    return api.get<UnreadCountResponse>('/api/v1/notifications/unread-count')
  },

  /**
   * Triggers an on-demand deadline and limit evaluation on the server.
   */
  evaluate: (): Promise<EvaluateAlertsResponse> => {
    return api.post<EvaluateAlertsResponse>('/api/v1/notifications/evaluate', {})
  },

  /**
   * Marks a single notification as read.
   */
  markAsRead: (id: string): Promise<SingleNotificationResponse> => {
    return api.patch<SingleNotificationResponse>(`/api/v1/notifications/${id}/read`, {})
  },

  /**
   * Marks all unread notifications as read.
   */
  markAllAsRead: (): Promise<MarkAllReadResponse> => {
    return api.patch<MarkAllReadResponse>('/api/v1/notifications/read-all', {})
  },

  /**
   * Deletes a notification by its ID.
   */
  delete: (id: string): Promise<{ status: 'success'; message: string }> => {
    return api.delete<{ status: 'success'; message: string }>(`/api/v1/notifications/${id}`)
  },

  /**
   * Returns the Server-Sent Events (SSE) stream endpoint URL.
   */
  getStreamUrl: (): string => {
    return buildApiUrl('/api/v1/notifications/stream')
  },
}
