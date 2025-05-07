const express = require('express');
const router = express.Router();
const topicsController = require('../controllers/topicsController');

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


router.post('/topics', topicsController.createTopic);

module.exports = router;