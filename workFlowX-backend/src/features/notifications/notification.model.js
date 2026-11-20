import mongoose from "mongoose";

export const NOTIFICATION_TYPES = {
    PROJECT_DEADLINE_APPROACHING: 'PROJECT_DEADLINE_APPROACHING',
    PROJECT_OVERDUE: 'PROJECT_OVERDUE',
    TASK_DUE_SOON: 'TASK_DUE_SOON',
    TASK_OVERDUE: 'TASK_OVERDUE',
    NOTE_REMINDER: 'NOTE_REMINDER',
    FINANCE_LARGE_EXPENSE: 'FINANCE_LARGE_EXPENSE',
    FINANCE_LIMIT_REACHED: 'FINANCE_LIMIT_REACHED',
    SYSTEM: 'SYSTEM',
};

export const NOTIFICATION_PRIORITY = {
    INFO: 'info',       // Blue / Neutral
    WARNING: 'warning', // Orange / Amber (Matches WorkFlowX theme!)
    CRITICAL: 'critical'// Red
};

export const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Notification must belong to a user'],
            index: true,
        },
        type: {
            type: String,
            enum: Object.values(NOTIFICATION_TYPES),
            required: true,
            index: true,
        },
        priority: {
            type: String,
            enum: Object.values(NOTIFICATION_PRIORITY),
            default: NOTIFICATION_PRIORITY.INFO,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxLength: 120,
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            maxLength: 500,
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {}, // Stores entity IDs ({ projectId, taskId, transactionId }), links, remaining days
        },
        readAt: {
            type: Date,
            default: null, // null means unread
            index: true,
        },
    },
    {
        timestamps: true
    }
);

// High performance compound index for unread queries
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;