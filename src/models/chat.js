const mongoose = require('mongoose');

const { Schema } = mongoose;

const ChatSchema = new Schema({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    messages: [{
        type: Schema.Types.ObjectId,
        ref: "Message",
    }],
    lastUpdate: {
        type: Date,
        default: Date.now
    }
});
const Chat = mongoose.model('Chat', ChatSchema);
module.exports = Chat;