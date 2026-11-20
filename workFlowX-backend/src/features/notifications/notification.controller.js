import {
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    runWorkspaceAlertEvaluation,
} from './notification.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { eventBus, CHANNELS } from '../../services/eventBus.service.js';

// GET /api/v1/notifications
export const getNotifications = catchAsync(async (req, res) => {
    // Automatically evaluate project & task deadlines to generate fresh alerts
    await runWorkspaceAlertEvaluation(req.user._id);

    const { page, limit, unreadOnly } = req.query;
    const result = await getUserNotifications(req.user._id, {
        page,
        limit,
        unreadOnly: unreadOnly === 'true',
    });

    res.status(200).json({
        status: 'success',
        ...result,
    });
});

// POST /api/v1/notifications/evaluate
// On-demand trigger for frontend workspace/dashboard
export const evaluateAlerts = catchAsync(async (req, res) => {
    await runWorkspaceAlertEvaluation(req.user._id);
    const unreadCount = await getUnreadNotificationCount(req.user._id);

    res.status(200).json({
        status: 'success',
        message: 'Workspace alerts evaluated successfully',
        unreadCount,
    });
});

// GET /api/v1/notifications/unread-count
export const getUnreadCount = catchAsync(async (req, res) => {
    const unreadCount = await getUnreadNotificationCount(req.user._id);
    res.status(200).json({
        status: 'success',
        unreadCount,
    });
});

// PATCH /api/v1/notifications/:id/read
export const markRead = catchAsync(async (req, res) => {
    const { id } = req.params;
    const notification = await markNotificationAsRead(id, req.user._id);

    res.status(200).json({
        status: 'success',
        message: 'Notification marked as read',
        data: notification,
    });
});

// PATCH /api/v1/notifications/read-all
export const markAllRead = catchAsync(async (req, res) => {
    const result = await markAllNotificationsAsRead(req.user._id);
    res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read',
        ...result,
    });
});

// DELETE /api/v1/notifications/:id
export const removeNotification = catchAsync(async (req, res) => {
    const { id } = req.params;
    await deleteNotificationById(id, req.user._id);

    res.status(200).json({
        status: 'success',
        message: 'Notification deleted successfully',
    });
});

// GET /api/v1/notifications/stream (Server-Sent Events)
export const streamNotification = (req, res) => {
    const userId = req.user._id.toString();

    // Set required SSE streaming headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disables Nginx buffering in production
    });

    const safeWrite = (data) => {
        if (!res.writableEnded && !res.destroyed) {
            try {
                res.write(data);
            } catch (err) {
                // Socket was closed; ignore
            }
        }
    };

    safeWrite(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Real-time notification stream active' })}\n\n`);

    const onNotification = ({ userId: targetUserId, notification }) => {
        if (targetUserId === userId) {
            safeWrite(`event: notification\ndata: ${JSON.stringify(notification)}\n\n`);
        }
    };

    eventBus.subscribe(CHANNELS.USER_NOTIFICATIONS, onNotification);

    const keepAliveInterval = setInterval(() => {
        safeWrite(': keep-alive\n\n');
    }, 25000);

    res.on('close', () => {
        clearInterval(keepAliveInterval);
        const notifHandlers = eventBus.handlers.get(CHANNELS.USER_NOTIFICATIONS);
        if (notifHandlers) {
            const index = notifHandlers.indexOf(onNotification);
            if (index !== -1) notifHandlers.splice(index, 1);
        }
    });
};