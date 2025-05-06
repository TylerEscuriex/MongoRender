const Volunteer = require('../models/Volunteer');

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