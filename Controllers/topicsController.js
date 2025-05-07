// topicsController.js - Fixed version

const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://tylerescuriex:TBa1CJQFexW4Q1mi@temdb.n06hy6j.mongodb.net/";

async function getAllTopicsWithMessages() {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        const topics = db.collection('MyDBexample');

        // Find all topics with their messages directly
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

// Rest of your functions remain the same...

module.exports = {
    getAllTopicsWithMessages,
    createTopic,
    subscribeToTopic,
    unsubscribeFromTopic,
};