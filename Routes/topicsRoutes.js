// Updated topicsRoutes.js
const express = require('express');
const router = express.Router();
const topicsController = require('../Controllers/topicsController');

// GET request to fetch topics and render the topics page
router.get('/topics', async (req, res) => {
    try {
        // Fetch all topics along with their messages/comments
        const topics = await topicsController.getAllTopicsWithMessages();
        // Render the topics page with the fetched topics
        res.render('topics', { topics });
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST request to handle form submissions
router.post('/topics', (req, res) => {
    // If topicName is provided, it's adding a message to an existing topic
    if (req.body.topicName) {
        return topicsController.addMessage(req, res);
    }
    // Otherwise, it's creating a new topic
    return topicsController.createTopic(req, res);
});

module.exports = router;