const path = require('path');
const { MongoClient } = require("mongodb");
const crypto = require('crypto');
const uri = "mongodb+srv://tylerescuriex:TBa1CJQFexW4Q1mi@temdb.n06hy6j.mongodb.net/";

// Function to render the register form
exports.renderRegisterForm = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'register.html'));
};

// Function to render the login form
exports.renderLoginForm = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
};

// Function to handle user registration
exports.registerUser = async (req, res) => {
    try {
        const { user_ID, password } = req.body;

        // Hash the password
        const hashedPassword = hashPassword(password);

        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        const users = db.collection('users');

        // Check if user already exists
        const existingUser = await users.findOne({ user_ID });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Insert the new user into the database
        await users.insertOne({ user_ID, password: hashedPassword });
        await client.close();

        res.redirect('/'); // Redirect to homepage after successful registration
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Function to handle user login
exports.loginUser = async (req, res) => {
    try {
        const { user_ID, password } = req.body;

        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb');
        const users = db.collection('users');

        const user = await users.findOne({ user_ID });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const hashedPassword = hashPassword(password);
        if (hashedPassword !== user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set cookie
        res.cookie('authToken', user_ID, { httpOnly: true });

        res.redirect('/'); // Redirect to homepage after successful login
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Custom hashing function using SHA-256
function hashPassword(password) {
    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
}
