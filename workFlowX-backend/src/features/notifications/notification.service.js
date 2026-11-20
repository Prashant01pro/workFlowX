import Notification, { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from './notification.model.js';
import AppError from '../../utils/appError.js';
import { eventBus, CHANNELS } from '../../services/eventBus.service.js';
import { Project } from '../projects/project.model.js';
import { Task } from '../tasks/task.model.js';
import { Note } from '../notes/note.model.js';
import { Transaction } from '../transactions/transaction.model.js';

// Helper: Checks if a similar notification was already created in the last 24 hours to prevent duplicate spam
const hasRecentNotification = async (userId, type, entityKey, entityId) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await Notification.findOne({
        userId,
        type,
        [`data.${entityKey}`]: entityId.toString(),
        createdAt: { $gte: oneDayAgo },
    });
    return !!existing;
};

// Creates and persists a durable notification, broadcasting to real-time SSE
export const createNotification = async ({
    userId,
    type,
    title,
    message,
    priority = NOTIFICATION_PRIORITY.INFO,
    data = {},
}) => {
    try {
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            priority,
            data,
        });

        // Broadcast in real-time across active SSE streams
        await eventBus.publish(CHANNELS.USER_NOTIFICATIONS, {
            userId: userId.toString(),
            notification,
        });

        return notification;
    } catch (error) {
        console.error('Failed to create in-app notification:', error.message);
    }
};

// Lists notifications for a user with pagination
export const getUserNotifications = async (userId, { page = 1, limit = 10, unreadOnly = false }) => {
    const filter = { userId };
    if (unreadOnly) {
        filter.readAt = null;
    }

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (safePage - 1) * safeLimit;

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
        Notification.countDocuments(filter),
        Notification.countDocuments({ userId, readAt: null }),
    ]);

    return {
        notifications,
        total,
        unreadCount,
        page: safePage,
        pages: Math.ceil(total / safeLimit),
    };
};

// Fast badge counter for unread notifications
export const getUnreadNotificationCount = async (userId) => {
    return await Notification.countDocuments({ userId, readAt: null });
};

// Marks a single notification as read
export const markNotificationAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    if (!notification.readAt) {
        notification.readAt = new Date();
        await notification.save();
    }
    return notification;
};

// Marks all unread notifications as read for a user
export const markAllNotificationsAsRead = async (userId) => {
    const result = await Notification.updateMany(
        { userId, readAt: null },
        { $set: { readAt: new Date() } }
    );

    return { modifiedCount: result.modifiedCount };
};

// Deletes a notification
export const deleteNotificationById = async (notificationId, userId) => {
    const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });
    if (!notification) {
        throw new AppError('Notification not found', 404);
    }
    return notification;
};

// Project Deadlines Alert Evaluator
export const checkProjectDeadlines = async (userId) => {
    const now = new Date();
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Find active or paused projects that have a deadline
    const projects = await Project.find({
        user: userId,
        status: { $in: ['active', 'paused'] },
        deadline: { $exists: true, $ne: null },
    });

    for (const project of projects) {
        const deadlineDate = new Date(project.deadline);
        const timeDiff = deadlineDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
            // Overdue
            const alreadyNotified = await hasRecentNotification(
                userId,
                NOTIFICATION_TYPES.PROJECT_OVERDUE,
                'projectId',
                project._id
            );
            if (!alreadyNotified) {
                await createNotification({
                    userId,
                    type: NOTIFICATION_TYPES.PROJECT_OVERDUE,
                    priority: NOTIFICATION_PRIORITY.CRITICAL,
                    title: `Project Overdue: ${project.title}`,
                    message: `The deadline for "${project.title}" passed ${Math.abs(daysLeft)} day(s) ago.`,
                    data: { projectId: project._id, daysLeft },
                });
            }
        } else if (daysLeft <= 3) {
            // Approaching within 3 days
            const alreadyNotified = await hasRecentNotification(
                userId,
                NOTIFICATION_TYPES.PROJECT_DEADLINE_APPROACHING,
                'projectId',
                project._id
            );
            if (!alreadyNotified) {
                const message =
                    daysLeft === 0
                        ? `Project "${project.title}" is due today!`
                        : `Project "${project.title}" has ${daysLeft} day(s) remaining until its deadline.`;

                await createNotification({
                    userId,
                    type: NOTIFICATION_TYPES.PROJECT_DEADLINE_APPROACHING,
                    priority: daysLeft <= 1 ? NOTIFICATION_PRIORITY.WARNING : NOTIFICATION_PRIORITY.INFO,
                    title: `Project Deadline Approaching: ${project.title}`,
                    message,
                    data: { projectId: project._id, daysLeft },
                });
            }
        }
    }
};

//  Task Deadlines Alert Evaluator
export const checkTaskDeadlines = async (userId) => {
    const now = new Date();

    // Find incomplete tasks with a due date
    const tasks = await Task.find({
        user: userId,
        status: { $ne: 'completed' },
        dueDate: { $exists: true, $ne: null },
    });

    for (const task of tasks) {
        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
            // Overdue task
            const alreadyNotified = await hasRecentNotification(
                userId,
                NOTIFICATION_TYPES.TASK_OVERDUE,
                'taskId',
                task._id
            );
            if (!alreadyNotified) {
                await createNotification({
                    userId,
                    type: NOTIFICATION_TYPES.TASK_OVERDUE,
                    priority: NOTIFICATION_PRIORITY.CRITICAL,
                    title: `Task Overdue: ${task.title}`,
                    message: `Task "${task.title}" is past its due date.`,
                    data: { taskId: task._id, priority: task.priority },
                });
            }
        } else if (daysLeft <= 1) {
            // Due today or tomorrow
            const alreadyNotified = await hasRecentNotification(
                userId,
                NOTIFICATION_TYPES.TASK_DUE_SOON,
                'taskId',
                task._id
            );
            if (!alreadyNotified) {
                await createNotification({
                    userId,
                    type: NOTIFICATION_TYPES.TASK_DUE_SOON,
                    priority: NOTIFICATION_PRIORITY.WARNING,
                    title: `Task Due Soon: ${task.title}`,
                    message:
                        daysLeft === 0
                            ? `Task "${task.title}" is due today!`
                            : `Task "${task.title}" is due tomorrow.`,
                    data: { taskId: task._id, priority: task.priority },
                });
            }
        }
    }
};

//  Notes Alert Evaluator (Pinned Notes Review)
export const checkNotesReminders = async (userId) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find pinned notes not updated in the last 7 days
    const stalePinnedNotes = await Note.find({
        user: userId,
        isPinned: true,
        updatedAt: { $lte: sevenDaysAgo },
    }).limit(3);

    for (const note of stalePinnedNotes) {
        const alreadyNotified = await hasRecentNotification(
            userId,
            NOTIFICATION_TYPES.NOTE_REMINDER,
            'noteId',
            note._id
        );
        if (!alreadyNotified) {
            await createNotification({
                userId,
                type: NOTIFICATION_TYPES.NOTE_REMINDER,
                priority: NOTIFICATION_PRIORITY.INFO,
                title: `Pinned Note Reminder: ${note.title}`,
                message: `You pinned "${note.title}" over a week ago. Take a moment to review or update it.`,
                data: { noteId: note._id },
            });
        }
    }
};

//  Financial Transaction & Budget Alert (Called upon creating an expense)
export const checkTransactionAlerts = async (userId, transaction) => {
    if (transaction.type !== 'expense') return;

    //  High-value single expense threshold (e.g., $500 or more)
    const LARGE_EXPENSE_THRESHOLD = 500;
    if (transaction.amount >= LARGE_EXPENSE_THRESHOLD) {
        await createNotification({
            userId,
            type: NOTIFICATION_TYPES.FINANCE_LARGE_EXPENSE,
            priority: NOTIFICATION_PRIORITY.WARNING,
            title: `Large Expense Recorded: $${transaction.amount}`,
            message: `A large expense of $${transaction.amount} was recorded under "${transaction.category}".`,
            data: { transactionId: transaction._id, amount: transaction.amount, category: transaction.category },
        });
    }

    //  Category spending limit alert (e.g., checking monthly cumulative expenses in this category)
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const categoryTotals = await Transaction.aggregate([
        {
            $match: {
                user: userId,
                type: 'expense',
                category: transaction.category,
                date: { $gte: startOfMonth },
            },
        },
        {
            $group: {
                _id: '$category',
                totalSpent: { $sum: '$amount' },
            },
        },
    ]);

    const totalSpentThisMonth = categoryTotals[0]?.totalSpent || transaction.amount;
    const CATEGORY_DEFAULT_LIMIT = 1000; // Configurable per category or default limit

    if (totalSpentThisMonth >= CATEGORY_DEFAULT_LIMIT) {
        const alreadyNotified = await hasRecentNotification(
            userId,
            NOTIFICATION_TYPES.FINANCE_LIMIT_REACHED,
            'category',
            transaction.category
        );
        if (!alreadyNotified) {
            await createNotification({
                userId,
                type: NOTIFICATION_TYPES.FINANCE_LIMIT_REACHED,
                priority: NOTIFICATION_PRIORITY.CRITICAL,
                title: `Category Budget Limit Reached: ${transaction.category}`,
                message: `You have spent $${totalSpentThisMonth.toFixed(2)} on "${transaction.category}" this month, exceeding the monthly threshold.`,
                data: { category: transaction.category, totalSpent: totalSpentThisMonth },
            });
        }
    }
};

//  Master Workspace Evaluator (Executes all time-based checks in parallel)
export const runWorkspaceAlertEvaluation = async (userId) => {
    await Promise.allSettled([
        checkProjectDeadlines(userId),
        checkTaskDeadlines(userId),
        checkNotesReminders(userId),
    ]);
};