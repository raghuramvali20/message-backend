const mongoose = require('mongoose');
const Chat = require('../models/chat');
const Message = require('../models/message');
const User = require('../models/user');
const { getIo } = require('../../socket');
const { userSockets } = require('../sockets');
const { enrichMessagePayload, buildDisplayDate } = require('../utils/dateTimeFormatter');

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
    const senderSocketId = userSockets[senderId.toString()];
    const formattedMessageDoc = enrichMessagePayload(messageDoc.toObject ? messageDoc.toObject() : messageDoc);

    if (receiverSocketId) {
        getIo().to(receiverSocketId).emit('newMessage', { serverMessage: formattedMessageDoc });
    }

    if (senderSocketId) {
        getIo().to(senderSocketId).emit('message_received', {
            messageId: messageDoc._id.toString(),
            chatId: chat._id.toString(),
            senderId: senderId.toString(),
            receiverId: receiverId.toString(),
            status: 'received',
        });
    }

    return { messageDoc: formattedMessageDoc };
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
            select: 'userName profilePic online lastSeen'
        })
        .lean();

    const formattedList = chatList.map(chat => {
        const otherUser = chat.participants[0];
        const displayInfo = buildDisplayDate(chat.lastUpdate);

        return {
            id: chat._id.toString(),
            preview: chat.preview,
            userName: otherUser?.userName || '',
            profilePic: otherUser?.profilePic || '',
            receiverId: otherUser?._id?.toString() || '',
            online: otherUser?.online || false,
            lastSeen: otherUser?.lastSeen || null,
            lastUpdate: chat.lastUpdate,
            formattedTime: displayInfo.formattedTime,
            formattedDate: displayInfo.formattedDate,
            dateGroup: displayInfo.dateGroup,
            displayLabel: displayInfo.displayLabel
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
    const formattedMessages = messages.map(message => enrichMessagePayload(message));
    return { serverMessage: 'messages fetched', messages: formattedMessages };
};

module.exports = {
    sendMessage,
    searchChatsByUserId,
    searchChatByChatId
};
