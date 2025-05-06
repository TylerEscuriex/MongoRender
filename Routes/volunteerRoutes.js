const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');

// Volunteer routes
router.get('/:id', volunteerController.lookupVolunteer);

module.exports = router;
