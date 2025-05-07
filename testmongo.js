// testmongo.js - Updated to work in both local and Render environments

// Load environment variables from .env file
require('dotenv').config();

console.log("Application starting...");

const express = require('express');
const app = express();
const path = require('path');
// Use PORT from environment or fallback to 3000 for local development
const port = process.env.PORT || 3000;

// Import the singleton database connection
const database = require('./utils/database');
// Import the observer pattern implementation
const observer = require('./utils/observer');

console.log("Imported core modules");

// Import routes
let authRoutes, topicsRoutes;
try {
  console.log("Attempting to import route modules...");
  authRoutes = require('./Routes/authRoutes.js');
  topicsRoutes = require('./Routes/topicsRoutes.js');
  console.log("Successfully imported route modules");
} catch (error) {
  console.error("Error importing route modules:", error);
  process.exit(1); // Exit if route modules can't be loaded
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log("Added body parsing middleware");

// Set views directory - Use correct capitalization
app.set('views', path.join(__dirname, 'Views'));
app.set('view engine', 'ejs');
console.log("Set up EJS view engine with views directory:", path.join(__dirname, 'Views'));

// Custom cookie parser
app.use((req, res, next) => {
  if (req.headers.cookie) {
    const rawCookies = req.headers.cookie.split('; ');
    const cookies = {};
    rawCookies.forEach(rawCookie => {
      const [key, value] = rawCookie.split('=');
      cookies[key] = value;
    });
    req.cookies = cookies;
  } else {
    req.cookies = {};
  }
  next();
});
console.log("Added custom cookie parser middleware");

// Simple test route
app.get('/test', (req, res) => {
  res.send('Server is running correctly!');
});
console.log("Added test route at /test");

// Add a logout route
app.get('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.redirect('/');
});
console.log("Added logout route");

// Routes
try {
  app.use(authRoutes);
  console.log("Successfully registered auth routes");
} catch (error) {
  console.error("Error registering auth routes:", error);
}

try {
  app.use(topicsRoutes);
  console.log("Successfully registered topic routes");
} catch (error) {
  console.error("Error registering topic routes:", error);
}

// Default route - use EJS rendering - Updated to show recent messages (T2.1)
app.get('/', async (req, res) => {
  console.log("Handling request to homepage");
  const authToken = req.cookies.authToken;
  
  try {
    let subscribedTopics = [];
    
    // If user is logged in, get their subscribed topics with recent messages
    if (authToken) {
      const topicsController = require('./Controllers/topicsController');
      subscribedTopics = await topicsController.getTopicsWithRecentMessages(authToken);
    }
    
    res.render('home', { 
      authToken: authToken || null,
      subscribedTopics: subscribedTopics || []
    });
  } catch (error) {
    console.error("Error rendering homepage:", error);
    res.render('home', { 
      authToken: authToken || null,
      subscribedTopics: []
    });
  }
});
console.log("Added default route handler for homepage");

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Express error handler caught an error:", err);
  res.status(500).send('Something broke! Please check the server logs for details.');
});
console.log("Added error handling middleware");

// Start the server
async function startServer() {
  console.log("Starting server...");
  try {
    // Using the singleton database connection
    await database.connect();
    console.log("Database connected via Singleton pattern");
    
    // Listen on all interfaces (0.0.0.0) instead of just localhost
    // This works both locally and on Render
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Server started successfully on port ${port}`);
      
      // Detect if running in production (Render) or local environment
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        console.log(`Server is deployed and running on Render`);
      } else {
        console.log(`Server is running locally at http://localhost:${port}`);
      }
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error("Server error:", error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please use a different port.`);
      }
    });
  } catch (error) {
    console.error("Fatal error while starting server:", error);
  }
}

// Catch any unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process here, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
  // Don't exit the process here, just log the error
});

// Start the server
console.log("Calling startServer function...");
startServer();
console.log("Server startup process initiated");