// Controllers/topicsController.js
const { ObjectId } = require('mongodb');
const database = require('../Utils/database');
const observer = require('../Utils/observer');

// Get all topics
async function getAllTopics() {
    try {
        const topicsCollection = await database.getCollection('Topics');
        const topics = await topicsCollection.find({}).toArray();
        return topics;
    } catch (error) {
        console.error('Error fetching topics:', error);
        throw new Error('Internal Server Error');
    }
}

// Get topics with the 2 most recent messages for a specific user
async function getTopicsWithRecentMessages(userId) {
    try {
        const topicsCollection = await database.getCollection('Topics');
        const usersCollection = await database.getCollection('Users');
        const messagesCollection = await database.getCollection('Messages');
        
        // Find user to get subscribed topics
        const user = await usersCollection.findOne({ user_ID: userId });
        
        if (!user || !user.subscribedTopics) {
            return [];
        }
        
        // Convert string IDs to ObjectId if necessary
        const topicIds = user.subscribedTopics.map(id => 
            typeof id === 'string' ? new ObjectId(id) : id
        );
        
        // Get all topics that the user has subscribed to
        const subscribedTopics = await topicsCollection.find({
            _id: { $in: topicIds }
        }).toArray();
        
        // For each topic, get the 2 most recent messages and increment access count
        const topicsWithMessages = await Promise.all(subscribedTopics.map(async (topic) => {
            // Increment access count for statistics (T8)
            await topicsCollection.updateOne(
                { _id: topic._id },
                { $inc: { accessCount: 1 } }
            );
            
            // Get the 2 most recent messages for this topic
            const messages = await messagesCollection.find({ 
                topicId: topic._id.toString() 
            })
            .sort({ createdAt: -1 })
            .limit(2)
            .toArray();
            
            return {
                ...topic,
                messages: messages.map(msg => msg.content)
            };
        }));
        
        return topicsWithMessages;
    } catch (error) {
        console.error('Error fetching topics with messages:', error);
        throw new Error('Internal Server Error');
    }
}

// Get topics available for subscription
async function getAvailableTopics(userId) {
    try {
        const topicsCollection = await database.getCollection('Topics');
        const usersCollection = await database.getCollection('Users');
        
        // Find all topics
        const allTopics = await topicsCollection.find({}).toArray();
        
        // Find user's subscribed topics
        const user = await usersCollection.findOne({ user_ID: userId });
        
        if (!user || !user.subscribedTopics) {
            return allTopics;
        }
        
        // Convert string IDs to ObjectId if necessary
        const subscribedIds = user.subscribedTopics.map(id => 
            typeof id === 'string' ? id.toString() : id.toString()
        );
        
        // Filter out topics the user is already subscribed to
        const availableTopics = allTopics.filter(topic => 
            !subscribedIds.includes(topic._id.toString())
        );
        
        return availableTopics;
    } catch (error) {
        console.error('Error fetching available topics:', error);
        throw new Error('Internal Server Error');
    }
}

// Create a new topic
async function createTopic(req, res) {
    try {
        const { name, message } = req.body;
        const userId = req.cookies.authToken;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const topicsCollection = await database.getCollection('Topics');
        const usersCollection = await database.getCollection('Users');
        const messagesCollection = await database.getCollection('Messages');
        
        // Check if topic already exists
        const existingTopic = await topicsCollection.findOne({ name });
        if (existingTopic) {
            return res.status(400).json({ error: 'Topic already exists' });
        }
        
        // Find or create user
        let user = await usersCollection.findOne({ user_ID: userId });
        if (!user) {
            // Create user if they don't exist
            const result = await usersCollection.insertOne({
                user_ID: userId,
                password: "",
                subscribedTopics: []
            });
            user = {
                _id: result.insertedId,
                user_ID: userId,
                subscribedTopics: []
            };
            console.log('Created new user for topic creation:', userId);
        }
        
        // Create new topic with initial access count of 0
        const result = await topicsCollection.insertOne({
            name,
            createdBy: userId,
            createdAt: new Date(),
            accessCount: 0 // For tracking statistics (T8)
        });
        
        const topicId = result.insertedId;
        
        // Add initial message if provided
        if (message) {
            await messagesCollection.insertOne({
                topicId: topicId.toString(),
                content: message,
                postedBy: userId,
                createdAt: new Date()
            });
        }
        
        // Subscribe user to the new topic (T3)
        await usersCollection.updateOne(
            { user_ID: userId },
            { $addToSet: { subscribedTopics: topicId } }
        );
        
        // Register with observer pattern
        observer.subscribe(topicId.toString(), userId);
        
        // Notify any listeners (none for a new topic)
        observer.notify(topicId.toString(), `New topic created: ${name}`);
        
        res.redirect('/topics');
    } catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Add a message to a topic
async function addMessage(req, res) {
    try {
        const { topicName, message } = req.body;
        const userId = req.cookies.authToken;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const topicsCollection = await database.getCollection('Topics');
        const usersCollection = await database.getCollection('Users');
        const messagesCollection = await database.getCollection('Messages');
        
        // Find topic by name
        const topic = await topicsCollection.findOne({ name: topicName });
        
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        // Find or create user
        let user = await usersCollection.findOne({ user_ID: userId });
        if (!user) {
            // Create user if they don't exist
            const result = await usersCollection.insertOne({
                user_ID: userId,
                password: "",
                subscribedTopics: []
            });
            user = {
                _id: result.insertedId,
                user_ID: userId,
                subscribedTopics: []
            };
            console.log('Created new user for message posting:', userId);
        }
        
        // Initialize subscribedTopics if it doesn't exist
        if (!user.subscribedTopics) {
            user.subscribedTopics = [];
            await usersCollection.updateOne(
                { user_ID: userId },
                { $set: { subscribedTopics: [] } }
            );
        }
        
        const isSubscribed = user.subscribedTopics.some(id => 
            id && id.toString() === topic._id.toString()
        );
        
        if (!isSubscribed) {
            return res.status(403).json({ error: 'You must be subscribed to post messages' });
        }
        
        // Add message
        await messagesCollection.insertOne({
            topicId: topic._id.toString(),
            content: message,
            postedBy: userId,
            createdAt: new Date()
        });
        
        // Notify subscribers about new message using Observer pattern
        observer.notify(topic._id.toString(), `New message in topic '${topic.name}'`);
        
        res.redirect('/topics');
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Subscribe to a topic
async function subscribeToTopic(req, res) {
    try {
        const { topicId } = req.body;
        const userId = req.cookies.authToken;
        
        console.log('Subscribe attempt:', {topicId, userId}); // Debug logging
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const topicsCollection = await database.getCollection('Topics');
        const usersCollection = await database.getCollection('Users');
        
        // Find topic by ID
        let topicObjectId;
        try {
            topicObjectId = new ObjectId(topicId);
        } catch (error) {
            console.error('Invalid topic ID format:', topicId);
            return res.status(400).json({ error: 'Invalid topic ID format' });
        }
        
        const topic = await topicsCollection.findOne({ _id: topicObjectId });
        
        if (!topic) {
            console.error('Topic not found:', topicId);
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        console.log('Found topic:', topic.name); // Debug logging
        
        // Find user - Try to find existing user
        let user = await usersCollection.findOne({ user_ID: userId });
        
        // If user not found, create a new user record
        if (!user) {
            console.log('User not found, creating user record for:', userId);
            
            // Create a new user with the auth token as the ID
            const result = await usersCollection.insertOne({
                user_ID: userId,
                password: "", // Empty password since this is an auto-created user
                subscribedTopics: []
            });
            
            user = {
                _id: result.insertedId,
                user_ID: userId,
                subscribedTopics: []
            };
            
            console.log('Created new user:', user.user_ID);
        }
        
        console.log('Using user:', user.user_ID); // Debug logging
        
        // Initialize subscribedTopics array if it doesn't exist
        if (!user.subscribedTopics) {
            console.log('Initializing subscribedTopics array');
            await usersCollection.updateOne(
                { user_ID: userId },
                { $set: { subscribedTopics: [] } }
            );
            user.subscribedTopics = [];
        }
        
        // Check if user is already subscribed
        const isAlreadySubscribed = user.subscribedTopics.some(id => 
            id && id.toString() === topicId.toString()
        );
        
        if (isAlreadySubscribed) {
            console.log('User already subscribed to this topic');
            return res.redirect('/topics');
        }
        
        // Subscribe user to topic
        await usersCollection.updateOne(
            { user_ID: userId },
            { $addToSet: { subscribedTopics: topicObjectId } }
        );
        
        console.log('User successfully subscribed to topic');
        
        // Register with observer pattern
        observer.subscribe(topicId, userId);
        
        res.redirect('/topics');
    } catch (error) {
        console.error('Error subscribing to topic:', error);
        res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
}

// Unsubscribe from a topic (T2.2)
async function unsubscribeFromTopic(req, res) {
    try {
        const { topicId } = req.body;
        const userId = req.cookies.authToken;
        
        console.log('Unsubscribe attempt:', {topicId, userId}); // Debug logging
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const usersCollection = await database.getCollection('Users');
        
        // Convert topicId to ObjectId
        let topicObjectId;
        try {
            topicObjectId = new ObjectId(topicId);
        } catch (error) {
            console.error('Invalid topic ID format:', topicId);
            return res.status(400).json({ error: 'Invalid topic ID format' });
        }
        
        // Find user
        const user = await usersCollection.findOne({ user_ID: userId });
        if (!user) {
            console.error('User not found:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Unsubscribe user from topic
        await usersCollection.updateOne(
            { user_ID: userId },
            { $pull: { subscribedTopics: topicObjectId } }
        );
        
        console.log('User successfully unsubscribed from topic');
        
        // Unregister from observer pattern
        observer.unsubscribe(topicId, userId);
        
        res.redirect('/topics');
    } catch (error) {
        console.error('Error unsubscribing from topic:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Get topic access statistics (T8)
async function getTopicStatistics() {
    try {
        const topicsCollection = await database.getCollection('Topics');
        const topics = await topicsCollection.find({}).toArray();
        
        const statistics = {
            totalTopics: topics.length,
            totalAccesses: topics.reduce((sum, topic) => sum + (topic.accessCount || 0), 0),
            topicsByAccess: topics.map(topic => ({
                name: topic.name,
                accessCount: topic.accessCount || 0,
                _id: topic._id
            })).sort((a, b) => b.accessCount - a.accessCount)
        };
        
        return statistics;
    } catch (error) {
        console.error('Error calculating statistics:', error);
        throw new Error('Internal Server Error');
    }
}

module.exports = {
    getAllTopics,
    getTopicsWithRecentMessages,
    getAvailableTopics,
    createTopic,
    addMessage,
    subscribeToTopic,
    unsubscribeFromTopic,
    getTopicStatistics
};