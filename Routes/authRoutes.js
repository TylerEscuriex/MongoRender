
const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authController.js');

// Route to render the register form
router.get('/register', authController.renderRegisterForm);

// Route to render the login form
router.get('/login', authController.renderLoginForm);

// Route to handle user registration
router.post('/register', authController.registerUser);

// Route to handle user login
router.post('/login', authController.loginUser);

module.exports = router;
