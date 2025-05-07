// routes/topicsRoutes.js
const express = require('express');
const router = express.Router();
const topicsController = require('../Controllers/topicsController');

// GET request to fetch topics and render the topics page
router.get('/topics', async (req, res) => {
    try {
        // Fetch all topics along with their messages/comments
        const topics = await topicsController.getAllTopicsWithMessages();
        console.log('Fetched topics:', topics); // Add this for debugging
        
        // Render the topics page with the fetched topics
        res.render('topics', { 
            topics: topics || [], // Ensure topics is always defined
            authToken: req.cookies.authToken || null // Always pass authToken
        });
    } catch (error) {
        console.error('Error fetching topics:', error);
        // Render the page with an empty topics array in case of error
        res.render('topics', { 
            topics: [],
            authToken: req.cookies.authToken || null // Always pass authToken
        });
    }
});

// POST request to create a new topic
router.post('/topics', (req, res) => {
    // For any post requests, ensure we add the authToken to the request object
    req.authToken = req.cookies.authToken || null;
    // Call the controller function
    topicsController.createTopic(req, res);
});

module.exports = router;