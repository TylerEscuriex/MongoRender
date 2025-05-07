
class Observer {
    constructor() {
        this.observers = new Map(); 
    }

    subscribe(topicId, userId) {
        if (!this.observers.has(topicId)) {
            this.observers.set(topicId, []);
        }
        
        const subscribers = this.observers.get(topicId);
        if (!subscribers.includes(userId)) {
            subscribers.push(userId);
            console.log(`User ${userId} subscribed to topic ${topicId}`);
        }
    }

    unsubscribe(topicId, userId) {
        if (this.observers.has(topicId)) {
            const subscribers = this.observers.get(topicId);
            this.observers.set(topicId, subscribers.filter(id => id !== userId));
            console.log(`User ${userId} unsubscribed from topic ${topicId}`);
        }
    }

    notify(topicId, message) {
        if (this.observers.has(topicId)) {
            const subscribers = this.observers.get(topicId);
            subscribers.forEach(userId => {
                console.log(`Notifying user ${userId} about topic ${topicId}: ${message}`);
            });
        }
    }

    getSubscribers(topicId) {
        return this.observers.has(topicId) ? [...this.observers.get(topicId)] : [];
    }
}

module.exports = new Observer();
