import { EventEmitter } from 'events';

export const CHANNELS = {
    USER_NOTIFICATIONS: 'USER_NOTIFICATIONS',
    JOB_EVENTS: 'JOB_EVENTS',
};

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.handlers = new Map();
        this.handlers.set(CHANNELS.USER_NOTIFICATIONS, []);
        this.handlers.set(CHANNELS.JOB_EVENTS, []);
    }

    async publish(channel, payload) {
        const listeners = this.handlers.get(channel) || [];
        listeners.forEach((handler) => {
            try {
                handler(payload);
            } catch (err) {
                console.error(`Error in eventBus handler for ${channel}:`, err.message);
            }
        });
        this.emit(channel, payload);
    }

    subscribe(channel, handler) {
        if (!this.handlers.has(channel)) {
            this.handlers.set(channel, []);
        }
        this.handlers.get(channel).push(handler);
        this.on(channel, handler);
    }
}

export const eventBus = new EventBus();