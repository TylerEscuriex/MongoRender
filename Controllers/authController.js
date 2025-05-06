const Volunteer = require('../models/Volunteer');

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

// Log in a volunteer (implement authentication here)
exports.login = (req, res) => {
    res.render('login');
};