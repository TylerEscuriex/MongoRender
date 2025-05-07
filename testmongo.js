// testmongo.js - Updated with navigation bar support and EJS rendering

console.log("Application starting...");

const express = require('express');
const { MongoClient } = require("mongodb");
const app = express();
const path = require('path');
const port = process.env.PORT || 3000;

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

// MongoDB URI
const uri = process.env.MONGODB_URI || "mongodb+srv://tylerescuriex:TBa1CJQFexW4Q1mi@temdb.n06hy6j.mongodb.net/";
console.log("Using MongoDB URI:", uri.replace(/mongodb\+srv:\/\/[^:]+:([^@]+)@/, "mongodb+srv://[username]:[hidden]@"));

// Database connection
let client;
try {
  client = new MongoClient(uri);
  console.log("Created MongoDB client instance");
} catch (error) {
  console.error("Error creating MongoDB client:", error);
  process.exit(1);
}

// Connect to MongoDB
async function connectToDatabase() {
  console.log("Attempting to connect to MongoDB...");
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");
    
    // Test the connection by listing databases
    const dbList = await client.db().admin().listDatabases();
    console.log("Available databases:", dbList.databases.map(db => db.name).join(", "));
    
    return true;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    return false;
  }
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

// Default route - use EJS rendering
app.get('/', (req, res) => {
  console.log("Handling request to homepage");
  const authToken = req.cookies.authToken;
  res.render('home', { 
    authToken: authToken || null 
  });
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
    const connected = await connectToDatabase();
    if (connected) {
      const server = app.listen(port, () => {
        console.log(`Server started successfully on port ${port}`);
        console.log(`Server is accessible at http://localhost:${port}`);
      });
      
      // Handle server errors
      server.on('error', (error) => {
        console.error("Server error:", error);
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use. Please use a different port.`);
        }
      });
    } else {
      console.error("Failed to start server due to database connection issues");
    }
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