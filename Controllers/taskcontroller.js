const Task = require('../models/Task');
const { MongoClient } = require("mongodb");
// The uri string must be the connection string for the database (obtained on Atlas).
const uri = "mongodb+srv://tylerescuriex:TBa1CJQFexW4Q1mi@temdb.n06hy6j.mongodb.net/?retryWrites=true&w=majority&appName=temdb";

// Create a new task
exports.createTask = async (req, res) => {
    try {
        const { title, description, dueDate } = req.body;
        const task = new Task({ title, description, dueDate });
        await task.save();
        res.redirect('/tasks/view');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

// View all tasks
exports.viewTasks = async (req, res) => {
    try {
        const tasks = await Task.find();
        res.render('tasks/view', { tasks });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};
