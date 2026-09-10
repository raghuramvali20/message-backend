const mongoose = require('mongoose');

const { Schema } = mongoose;

const ChatSchema = new Schema({
    participantKey: {
        type: String,
        required: true,
        unique: true,
        sparse: true,
        index: true
    },
    participants: [{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked'],
        default: 'accepted'
    },
    requestedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    blockedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    preview: {
        type:String,
        required: true
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    },
    messageCount: {
        type: Number,
        default: 0,
        min: 0
    }
});
const Chat = mongoose.model('Chat', ChatSchema);
module.exports = Chat;