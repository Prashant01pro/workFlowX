import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import {
    getNotifications,
    getUnreadCount,
    markRead,
    markAllRead,
    removeNotification,
    streamNotification,
    evaluateAlerts,
} from './notification.controller.js';

const router = express.Router();

router.use(authenticate); // User must be logged in

// Real-time SSE stream endpoint (mounted before parameterized /:id routes)
router.get('/stream', streamNotification);

// On-demand evaluation endpoint for workspace deadlines & limits
router.post('/evaluate', evaluateAlerts);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/:id', removeNotification);

export default router;