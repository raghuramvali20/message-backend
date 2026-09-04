const mongoose = require('mongoose');

const { Schema } = mongoose;

const messageSchema = new Schema({
    chatId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // cipherTextForSender: { 
    //     type: String 
    // },
    // cipherTextForReceiver: { 
    //     type: String, required: true 
    // },
    messageText: {
        type: String,
        required: true
    },
    time: {
        type: String,
        default: new Date().toISOString()
    },
    status: {
        type: String,
        enum: ['sent', 'received', 'seen'],
        default: 'sent'
    },
    edited: {
        type: Boolean,
        default: false
    }
});
const Message =  mongoose.model('Message', messageSchema);
module.exports = Message;
