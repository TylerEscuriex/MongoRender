const path = require('path');
const { MongoClient } = require("mongodb");
const crypto = require('crypto');
const uri = process.env.MONGODB_URI || "mongodb+srv://tylerescuriex:TBa1CJQFexW4Q1mi@temdb.n06hy6j.mongodb.net/";

// Function to render the register form
exports.renderRegisterForm = (req, res) => {
    res.render('register', { 
        authToken: null,
        errorMessage: null
    });
};

// Function to render the login form
exports.renderLoginForm = (req, res) => {
    res.render('login', { 
        authToken: null,
        errorMessage: null
    });
};

// Function to handle user registration
exports.registerUser = async (req, res) => {
    try {
        const { user_ID, password } = req.body;

        if (!user_ID || !password) {
            return res.render('register', {
                authToken: null,
                errorMessage: 'Username and password are required'
            });
        }

        // Hash the password
        const hashedPassword = hashPassword(password);

        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        const users = db.collection('Users');

        // Check if user already exists
        const existingUser = await users.findOne({ user_ID });
        if (existingUser) {
            await client.close();
            return res.render('register', {
                authToken: null,
                errorMessage: 'Username already exists'
            });
        }

        // Insert the new user into the database
        await users.insertOne({ 
            user_ID, 
            password: hashedPassword,
            subscribedTopics: [] // Initialize empty subscribedTopics array
        });
        
        await client.close();

        // Set cookie for auto-login
        res.cookie('authToken', user_ID, { httpOnly: true });
        
        res.redirect('/'); // Redirect to homepage after successful registration
    } catch (error) {
        console.error('Error registering user:', error);
        res.render('register', {
            authToken: null,
            errorMessage: 'An error occurred during registration. Please try again.'
        });
    }
};

// Function to handle user login
exports.loginUser = async (req, res) => {
    try {
        const { user_ID, password } = req.body;

        if (!user_ID || !password) {
            return res.render('login', {
                authToken: null,
                errorMessage: 'Username and password are required'
            });
        }

        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        const users = db.collection('Users');

        const user = await users.findOne({ user_ID });
        if (!user) {
            await client.close();
            return res.render('login', {
                authToken: null,
                errorMessage: 'Invalid username or password'
            });
        }

        const hashedPassword = hashPassword(password);
        if (hashedPassword !== user.password) {
            await client.close();
            return res.render('login', {
                authToken: null,
                errorMessage: 'Invalid username or password'
            });
        }

        await client.close();
        
        // Set cookie
        res.cookie('authToken', user_ID, { httpOnly: true });

        res.redirect('/'); // Redirect to homepage after successful login
    } catch (error) {
        console.error('Error logging in:', error);
        res.render('login', {
            authToken: null,
            errorMessage: 'An error occurred. Please try again.'
        });
    }
};

// Custom hashing function using SHA-256
function hashPassword(password) {
    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
}
