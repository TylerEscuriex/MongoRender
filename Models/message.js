
const { Schema, model } = require('mongoose');

const messageSchema = new Schema({
    content: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Message = model('Message', messageSchema);

module.exports = Message;
