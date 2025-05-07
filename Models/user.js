// models/User.js

const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    user_ID: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    subscribedTopics: [{ type: Schema.Types.ObjectId, ref: 'Topic' }] // Array of subscribed topics
});

const User = model('User', userSchema);

module.exports = User;