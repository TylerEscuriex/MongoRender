const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Task routes
router.post('/create', taskController.createTask);
router.get('/view', taskController.viewTasks);

module.exports = router;
