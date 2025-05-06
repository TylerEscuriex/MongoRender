const Volunteer = require('../models/Volunteer');
const { MongoClient } = require("mongodb");
// The uri string must be the connection string for the database (obtained on Atlas).
const uri = "mongodb+srv://tylerescuriex:TBa1CJQFexW4Q1mi@temdb.n06hy6j.mongodb.net/?retryWrites=true&w=majority&appName=temdb";

// Look up a volunteer by ID
exports.lookupVolunteer = async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);
        if (!volunteer) {
            return res.status(404).send('Volunteer not found');
        }
        res.render('volunteers/lookup', { volunteer });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};
