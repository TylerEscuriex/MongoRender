// models/Topic.js
const { Schema, model } = require('mongoose');

const topicSchema = new Schema({
    name: { type: String, required: true, unique: true },
    messages: [{ type: String, required: true }] // Define messages as an array of strings
});

const Topic = model('Topic', topicSchema);

module.exports = Topic;