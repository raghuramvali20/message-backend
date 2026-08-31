const mongoose = require('mongoose');
const Chat = require('../models/chat');
const Message = require('../models/message');
const User = require('../models/user');
const { getIo } = require('../../socket');
const { userSockets } = require('../sockets');

const sendMessage = async ({ senderId, receiverId, messageText }) => {
    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
        const error = new Error('Invalid receiver id');
        error.statusCode = 400;
        throw error;
    }
    if (!senderId || !mongoose.Types.ObjectId.isValid(senderId)) {
        const error = new Error('Invalid sender id');
        error.statusCode = 400;
        throw error;
    }
    if (!messageText || typeof messageText !== 'string' || messageText.trim().length === 0 || messageText.trim().length > 5000) {
        const error = new Error('Message text is required and must be between 1-5000 characters');
        error.statusCode = 400;
        throw error;
    }

    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver) {
        const error = new Error('Receiver does not exist');
        error.statusCode = 404;
        throw error;
    }
    if (!sender) {
        const error = new Error('Sender does not exist');
        error.statusCode = 404;
        throw error;
    }

    let chat = await Chat.findOne({
        participants: { $all: [senderId, receiverId] }
    });

    if (!chat) {
        chat = new Chat({
            participants: [senderId, receiverId],
            preview: messageText,
            lastUpdate: new Date().toISOString()
        });
        await chat.save();
    } else {
        chat.preview = messageText;
        chat.lastUpdate = new Date().toISOString();
        await chat.save();
    }

    const messageDoc = new Message({
        chatId: chat._id,
        messageText,
        time: new Date().toISOString(),
        senderId,
        receiverId
    });
    await messageDoc.save();

    const receiverSocketId = userSockets[receiverId.toString()];
    if (receiverSocketId) {
        getIo().to(receiverSocketId).emit('newMessage', { serverMessage: messageDoc });
    }

    return { messageDoc };
};

const searchChatsByUserId = async (userId) => {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        const error = new Error('Invalid user id');
        error.statusCode = 400;
        throw error;
    }

    const chatList = await Chat.find({ participants: userId })
        .populate({
            path: 'participants',
            match: { _id: { $ne: userId } },
            select: 'userName profilePic preview'
        })
        .lean();

    const formattedList = chatList.map(chat => {
        const otherUser = chat.participants[0];
        return {
            id: chat._id.toString(),
            preview: chat.preview,
            userName: otherUser?.userName || '',
            profilePic: otherUser?.profilePic || '',
            receiverId: otherUser?._id?.toString() || ''
        };
    });

    return { chatList: formattedList };
};

const searchChatByChatId = async ({ chatId, userId }) => {
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
        const error = new Error('Invalid chat id');
        error.statusCode = 400;
        throw error;
    }

    const messages = await Message.find({ chatId }).lean();
    return { serverMessage: 'messages fetched', messages };
};

module.exports = {
    sendMessage,
    searchChatsByUserId,
    searchChatByChatId
};
