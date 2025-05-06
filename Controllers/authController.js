const path = require('path');
const { MongoClient } = require("mongodb");
const Volunteer = require('../models/Volunteer');
// The uri string must be the connection string for the database (obtained on Atlas).
const uri = "mongodb+srv://tylerescuriex:TBa1CJQFexW4Q1mi@temdb.n06hy6j.mongodb.net/?retryWrites=true&w=majority&appName=temdb";


// Register a new volunteer
exports.register = async (req, res) => {
    try {
        const { name, email } = req.body;
        const volunteer = new Volunteer({ name, email });
        await volunteer.save();
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

// Connect to MongoDB
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('temdb'); // Change to your database name
        const users = db.collection('users'); // Create a collection named 'users'

// Log in a volunteer (implement authentication here)
exports.login = (req, res) => {
    res.render('login');
};
