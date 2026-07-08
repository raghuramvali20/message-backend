const mongoose = require('mongoose');

const { Schema } = mongoose;

const ChatSchema = new Schema({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    preview: {
        type:String,
        required: true
    },
    lastUpdate: {
        type: String,
        default: new Date()
    }
});
const Chat = mongoose.model('Chat', ChatSchema);
module.exports = Chat;