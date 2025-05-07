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

        // Fetch messages for each topic
        const topicsWithMessages = await Promise.all(allTopics.map(async topic => {
            topic.messages = await getMessagesByTopicName(topic.name); // Corrected here
            return topic;
        }));

        await client.close(); // Close the client connection

        return topicsWithMessages;
    } catch (error) {
        console.error('Error fetching topics with messages:', error);
        throw new Error('Internal Server Error');
    }
}

async function getMessagesByTopicName(topicName) {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        const topics = db.collection('MyDBexample');

        // Find messages for the given topic name
        const topic = await topics.findOne({ name: topicName });

        await client.close(); // Close the client connection

        return topic ? topic.messages : [];
    } catch (error) {
        console.error(`Error fetching messages for topic ${topicName}:`, error);
        throw new Error('Internal Server Error');
    }
}
async function createTopic(req, res) {
    try {
        // Extract topic details from request body
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
            return res.status(404).json({ error: 'Topic not found' });
        }

        // Add the new message to the topic
        await topics.updateOne({ name: topicName }, { $push: { messages: message } });

        await client.close();

        // Redirect back to the topics page
        res.redirect('/topics');
    } catch (error) {
        console.error('Error creating message:', error);
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
            return res.status(404).json({ error: 'User not found' });
        }

        // Add the topic name to the user's subscribed topics array
        user.subscribedTopics.push(topicName);
        
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
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove the topic name from the user's subscribed topics array
        user.subscribedTopics = user.subscribedTopics.filter(topic => topic !== topicName);
        
        // Update the user document
        await users.updateOne({ user_ID }, { $set: { subscribedTopics: user.subscribedTopics } });

        await client.close(); // Close the client connection

        res.redirect('/topics');
    } catch (error) {
        console.error('Error unsubscribing from topic:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}



module.exports = {
    getAllTopicsWithMessages,
    createTopic,
    subscribeToTopic,
    unsubscribeFromTopic,
};