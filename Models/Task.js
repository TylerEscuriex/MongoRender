const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer' },
});

module.exports = mongoose.model('Task', taskSchema);
