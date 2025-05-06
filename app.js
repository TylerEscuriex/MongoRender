const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const authMiddleware = require('./middleware/auth');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Routes
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/volunteers', volunteerRoutes);

// Protect routes with middleware
app.use('/tasks', authMiddleware);
app.use('/volunteers', authMiddleware);

// MongoDB connection
mongoose.connect('mongodb://localhost/helpers_system', { useNewUrlParser: true, useUnifiedTopology: true });

// Start server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
