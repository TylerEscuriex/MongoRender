// topicsController.js - Updated for new database structure

const { MongoClient, ObjectId } = require("mongodb");
const uri = "mongodb+srv://tylerescuriex:TBa1CJQFexW4Q1mi@temdb.n06hy6j.mongodb.net/";

async function getAllTopicsWithMessages() {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        
        // Get all topics from the Topics collection
        const topicsCollection = db.collection('Topics');
        const messagesCollection = db.collection('Messages');
        
        const allTopics = await topicsCollection.find({}).toArray();
        
        // For each topic, find its messages from the Messages collection
        const topicsWithMessages = await Promise.all(allTopics.map(async (topic) => {
            // Find all messages for this topic
            const topicMessages = await messagesCollection.find({ topicId: topic._id }).toArray();
            
            // Extract just the message content for compatibility with your views
            const messageContents = topicMessages.map(msg => msg.content);
            
            return {
                ...topic,
                messages: messageContents
            };
        }));
        
        await client.close();
        return topicsWithMessages;
    } catch (error) {
        console.error('Error fetching topics with messages:', error);
        throw new Error('Internal Server Error');
    }
}

async function createTopic(req, res) {
    try {
        // Extract topic details from request body
        const { name, message } = req.body;
        const userId = req.cookies.authToken; // Get user ID from cookies
        
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        
        const topicsCollection = db.collection('Topics');
        const messagesCollection = db.collection('Messages');
        const usersCollection = db.collection('Users');
        
        // Check if topic already exists
        const existingTopic = await topicsCollection.findOne({ name });
        
        let topicId;
        
        if (existingTopic) {
            topicId = existingTopic._id;
        } else {
            // Create new topic
            const newTopic = {
                name,
                createdBy: userId || null,
                createdAt: new Date()
            };
            
            const result = await topicsCollection.insertOne(newTopic);
            topicId = result.insertedId;
            
            // If user is logged in, subscribe them to the new topic
            if (userId) {
                await usersCollection.updateOne(
                    { _id: new ObjectId(userId) },
                    { $addToSet: { subscribedTopics: topicId } }
                );
            }
        }
        
        // Add initial message if provided
        if (message) {
            await messagesCollection.insertOne({
                topicId: topicId,
                content: message,
                postedBy: userId || null,
                postedAt: new Date()
            });
        }
        
        await client.close();
        res.redirect('/topics');
    } catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function addMessage(req, res) {
    try {
        // Extract message details from request body
        const { topicName, message } = req.body;
        const userId = req.cookies.authToken;
        
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        
        const topicsCollection = db.collection('Topics');
        const messagesCollection = db.collection('Messages');
        
        // Find topic by name
        const topic = await topicsCollection.findOne({ name: topicName });
        
        if (!topic) {
            await client.close();
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        // Add message to Messages collection
        await messagesCollection.insertOne({
            topicId: topic._id,
            content: message,
            postedBy: userId || null,
            postedAt: new Date()
        });
        
        await client.close();
        res.redirect('/topics');
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function subscribeToTopic(req, res) {
    try {
        const { topicName } = req.body;
        const userId = req.cookies.authToken;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        
        const topicsCollection = db.collection('Topics');
        const usersCollection = db.collection('Users');
        
        // Find topic by name
        const topic = await topicsCollection.findOne({ name: topicName });
        
        if (!topic) {
            await client.close();
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        // Subscribe user to topic
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $addToSet: { subscribedTopics: topic._id } }
        );
        
        await client.close();
        res.redirect('/topics');
    } catch (error) {
        console.error('Error subscribing to topic:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function unsubscribeFromTopic(req, res) {
    try {
        const { topicName } = req.body;
        const userId = req.cookies.authToken;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        
        const topicsCollection = db.collection('Topics');
        const usersCollection = db.collection('Users');
        
        // Find topic by name
        const topic = await topicsCollection.findOne({ name: topicName });
        
        if (!topic) {
            await client.close();
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        // Unsubscribe user from topic
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { subscribedTopics: topic._id } }
        );
        
        await client.close();
        res.redirect('/topics');
    } catch (error) {
        console.error('Error unsubscribing from topic:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Export all functions
module.exports = {
    getAllTopicsWithMessages,
    createTopic,
    addMessage,
    subscribeToTopic,
    unsubscribeFromTopic
};