// Routes/topicsRoutes.js
const express = require('express');
const router = express.Router();
const topicsController = require('../Controllers/topicsController');

// GET request to fetch topics and render the topics page
router.get('/topics', async (req, res) => {
    try {
        const userId = req.cookies.authToken;
        let subscribedTopics = [];
        let availableTopics = [];
        let statistics = {};
        
        // If user is logged in, get their subscribed topics with recent messages (T2.1)
        if (userId) {
            subscribedTopics = await topicsController.getTopicsWithRecentMessages(userId);
            // Get topics available for subscription (T2.2)
            availableTopics = await topicsController.getAvailableTopics(userId);
        } else {
            // If not logged in, get all topics
            availableTopics = await topicsController.getAllTopics();
        }
        
        // Get topic statistics (T8)
        statistics = await topicsController.getTopicStatistics();
        
        // Render the page with all data
        res.render('topics', { 
            subscribedTopics: subscribedTopics || [],
            availableTopics: availableTopics || [],
            statistics,
            authToken: userId || null
        });
    } catch (error) {
        console.error('Error loading topics page:', error);
        res.render('topics', { 
            subscribedTopics: [],
            availableTopics: [],
            statistics: { totalTopics: 0, totalAccesses: 0, topicsByAccess: [] },
            authToken: req.cookies.authToken || null
        });
    }
});

// POST request to create a new topic (T3)
router.post('/topics/create', topicsController.createTopic);

// POST request to add a message to a topic (T4)
router.post('/topics/message', topicsController.addMessage);

// POST request to subscribe to a topic
router.post('/topics/subscribe', topicsController.subscribeToTopic);

// POST request to unsubscribe from a topic (T2.2)
router.post('/topics/unsubscribe', topicsController.unsubscribeFromTopic);

module.exports = router;