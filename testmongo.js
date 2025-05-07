// testmongo.js

const express = require('express');
const { MongoClient } = require("mongodb");
const app = express();
const path = require('path');
const port = 3000;

// Import routes
const authRoutes = require('./routes/authRoutes.js');
const topicsRoutes = require('./routes/topicsRoutes.js');

// MongoDB URI
const uri = "mongodb+srv://tylerescuriex:TBa1CJQFexW4Q1mi@temdb.n06hy6j.mongodb.net/";

// Database connection
const client = new MongoClient(uri);

// Connect to MongoDB
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Set view engine
app.set('view engine', 'ejs');

// Routes
app.use(authRoutes);
app.use(topicsRoutes);

// Default route
app.get('/', (req, res) => {
    const authToken = req.cookies.authToken;
    const content = `
        You are authenticated as: ${authToken || 'Guest'} <br> 
        <button onclick="window.location.href='/topics'">View Topics</button>
        <button onclick="window.location.href='/register'">Register</button>
        <button onclick="window.location.href='/login'">Login</button>
    `;
    res.send(content);
});

// Start the server
async function startServer() {
    await connectToDatabase();
    app.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`);
    });
}

startServer();
