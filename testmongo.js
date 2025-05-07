// topicsController.js

const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://tylerescuriex:TBa1CJQFexW4Q1mi@temdb.n06hy6j.mongodb.net/";

async function getAllTopicsWithMessages() {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        const topics = db.collection('MyDBexample');

        // Find all topics
        const allTopics = await topics.find({}).toArray();

        // Ensure every topic has a messages array (even if empty)
        const topicsWithMessages = allTopics.map(topic => {
            // If topic doesn't have messages property, initialize it as an empty array
            if (!topic.messages) {
                topic.messages = [];
            }
            return topic;
        });

        await client.close(); // Close the client connection
        return topicsWithMessages;
    } catch (error) {
        console.error('Error fetching topics with messages:', error);
        throw new Error('Internal Server Error');
    }
}

// Function to create a new topic
async function createTopic(req, res) {
    try {
        // Extract topic details from request body
        const { name, message } = req.body;

        // Connect to MongoDB
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        const topics = db.collection('MyDBexample');

        // Check if topic already exists
        const existingTopic = await topics.findOne({ name });
        if (existingTopic) {
            // If topic exists and message is provided, add message to existing topic
            if (message) {
                await topics.updateOne(
                    { name }, 
                    { $push: { messages: message } }
                );
            }
        } else {
            // Create new topic with initial message
            await topics.insertOne({
                name,
                messages: message ? [message] : [] // Add initial message if provided
            });
        }

        await client.close();

        // Redirect back to the topics page
        res.redirect('/topics');
    } catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Function to add a message to an existing topic
async function addMessage(req, res) {
    try {
        // Extract message details from request body
        const { topicName, message } = req.body;

        // Connect to MongoDB
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        const topics = db.collection('MyDBexample');

        // Find the topic by name
        const topic = await topics.findOne({ name: topicName });

        if (!topic) {
            // If topic not found, return error
            await client.close();
            return res.status(404).json({ error: 'Topic not found' });
        }

        // Add the new message to the topic
        await topics.updateOne({ name: topicName }, { $push: { messages: message } });

        await client.close();

        // Redirect back to the topics page
        res.redirect('/topics');
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function subscribeToTopic(req, res) {
    try {
        const { topicName } = req.body;
        const user_ID = req.cookies.authToken; // Assuming user ID is available in cookies

        // Connect to MongoDB
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        const users = db.collection('MyDBexample');

        // Find the user by ID
        const user = await users.findOne({ user_ID });

        if (!user) {
            // User not found
            await client.close();
            return res.status(404).json({ error: 'User not found' });
        }

        // Initialize subscribedTopics array if it doesn't exist
        if (!user.subscribedTopics) {
            user.subscribedTopics = [];
        }

        // Add the topic name to the user's subscribed topics array if not already subscribed
        if (!user.subscribedTopics.includes(topicName)) {
            user.subscribedTopics.push(topicName);
        }
        
        // Update the user document
        await users.updateOne({ user_ID }, { $set: { subscribedTopics: user.subscribedTopics } });

        await client.close(); // Close the client connection

        res.redirect('/topics');
    } catch (error) {
        console.error('Error subscribing to topic:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function unsubscribeFromTopic(req, res) {
    try {
        const { topicName } = req.body;
        const user_ID = req.cookies.authToken; // Assuming user ID is available in cookies

        // Connect to MongoDB
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        const users = db.collection('MyDBexample');

        // Find the user by ID
        const user = await users.findOne({ user_ID });

        if (!user) {
            // User not found
            await client.close();
            return res.status(404).json({ error: 'User not found' });
        }

        // Initialize subscribedTopics if it doesn't exist
        if (!user.subscribedTopics) {
            user.subscribedTopics = [];
        } else {
            // Remove the topic name from the user's subscribed topics array
            user.subscribedTopics = user.subscribedTopics.filter(topic => topic !== topicName);
        }
        
        // Update the user document
        await users.updateOne({ user_ID }, { $set: { subscribedTopics: user.subscribedTopics } });

        await client.close(); // Close the client connection

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