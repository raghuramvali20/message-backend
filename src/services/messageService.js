const mongoose = require('mongoose');
const Chat = require('../models/chat');
const Message = require('../models/message');
const User = require('../models/user');
const { getIo } = require('../../socket');
const { userSockets } = require('../sockets');
const { enrichMessagePayload, buildDisplayDate } = require('../utils/dateTimeFormatter');

const buildParticipantKey = (firstUserId, secondUserId) => [
    firstUserId.toString(),
    secondUserId.toString()
].sort().join(':');

const isBlocked = (user, otherUserId) => (user.blockedUsers || [])
    .some(blockedUserId => blockedUserId.toString() === otherUserId.toString());

const getExistingChat = async (senderId, receiverId) => {
    const participantKey = buildParticipantKey(senderId, receiverId);
    let chat = await Chat.findOne({ participantKey });

    if (!chat) {
        chat = await Chat.findOne({
            participants: { $all: [senderId, receiverId], $size: 2 }
        });
        if (chat && !chat.participantKey) {
            chat.participantKey = participantKey;
            await chat.save();
        }
    }

    return chat;
};

const findOrCreateChat = async (senderId, receiverId) => {
    const participantKey = buildParticipantKey(senderId, receiverId);
    const existingChat = await getExistingChat(senderId, receiverId);
    if (existingChat) return existingChat;

    return Chat.findOneAndUpdate(
        { participantKey },
        {
            $setOnInsert: {
                participantKey,
                participants: [senderId, receiverId],
                preview: 'no message yet',
                messageCount: 0,
                status: 'pending',
                requestedBy: senderId
            }
        },
        { new: true, upsert: true }
    );
};

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

    if (senderId.toString() === receiverId.toString()) {
        const error = new Error('You cannot message yourself');
        error.statusCode = 400;
        throw error;
    }
    if (isBlocked(sender, receiverId) || isBlocked(receiver, senderId)) {
        const error = new Error('Messaging is unavailable for this user');
        error.statusCode = 403;
        throw error;
    }

    const chat = await findOrCreateChat(senderId, receiverId);

    const chatStatus = chat.status || 'accepted';
    if (chatStatus === 'blocked') {
        const error = new Error('This chat is blocked');
        error.statusCode = 403;
        throw error;
    }
    if (chatStatus === 'pending' && chat.requestedBy &&
        chat.requestedBy.toString() !== senderId.toString()) {
        const error = new Error('This message request is waiting for acceptance');
        error.statusCode = 403;
        throw error;
    }

    const messageDoc = new Message({
        chatId: chat._id,
        messageText,
        time: new Date().toISOString(),
        senderId,
        receiverId
    });
    await messageDoc.save();

    chat.preview = messageText;
    chat.lastUpdate = new Date();
    chat.messageCount = (chat.messageCount || 0) + 1;
    chat.status = chatStatus === 'accepted' ? 'accepted' : 'pending';
    if (chat.status === 'pending') chat.requestedBy = senderId;
    await chat.save();

    const receiverSocketId = userSockets[receiverId.toString()];
    const senderSocketId = userSockets[senderId.toString()];
    const formattedMessageDoc = enrichMessagePayload(messageDoc.toObject ? messageDoc.toObject() : messageDoc);
    const chatSummary = {
        id: chat._id.toString(),
        preview: messageText,
        userName: sender.userName,
        profilePic: sender.profilePic || '',
        receiverId: senderId.toString(),
        lastUpdate: chat.lastUpdate,
        online: sender.online || false,
        lastSeen: sender.lastSeen || null
    };

    if (receiverSocketId && chat.status === 'accepted') {
        getIo().to(receiverSocketId).emit('newMessage', {
            serverMessage: formattedMessageDoc,
            chat: chatSummary
        });
    }

    if (receiverSocketId && chat.status === 'pending') {
        getIo().to(receiverSocketId).emit('message_request', {
            message: formattedMessageDoc,
            sender: {
                id: senderId.toString(),
                userName: sender.userName,
                profilePic: sender.profilePic || ''
            },
            chatId: chat._id.toString()
        });
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

const ensureChat = async ({ userId, otherUserId }) => {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        const error = new Error('Invalid user id');
        error.statusCode = 400;
        throw error;
    }
    if (!otherUserId || !mongoose.Types.ObjectId.isValid(otherUserId)) {
        const error = new Error('Invalid other user id');
        error.statusCode = 400;
        throw error;
    }
    if (userId.toString() === otherUserId.toString()) {
        const error = new Error('You cannot create a chat with yourself');
        error.statusCode = 400;
        throw error;
    }

    const otherUser = await User.findById(otherUserId)
        .select('userName profilePic online lastSeen blockedUsers');
    if (!otherUser) {
        const error = new Error('User does not exist');
        error.statusCode = 404;
        throw error;
    }

    const currentUser = await User.findById(userId).select('blockedUsers');
    if (!currentUser) {
        const error = new Error('User does not exist');
        error.statusCode = 404;
        throw error;
    }
    if (isBlocked(currentUser, otherUserId) || isBlocked(otherUser, userId)) {
        const error = new Error('Chat is unavailable for this user');
        error.statusCode = 403;
        throw error;
    }

    const chat = await findOrCreateChat(userId, otherUserId);

    const displayInfo = buildDisplayDate(chat.lastUpdate);
    return {
        id: chat._id.toString(),
        preview: chat.preview,
        userName: otherUser.userName,
        profilePic: otherUser.profilePic || '',
        receiverId: otherUser._id.toString(),
        online: otherUser.online || false,
        lastSeen: otherUser.lastSeen || null,
        lastUpdate: chat.lastUpdate,
        formattedTime: displayInfo.formattedTime,
        formattedDate: displayInfo.formattedDate,
        dateGroup: displayInfo.dateGroup,
        displayLabel: displayInfo.displayLabel
    };
};

const searchChatsByUserId = async (userId) => {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        const error = new Error('Invalid user id');
        error.statusCode = 400;
        throw error;
    }

    const chatList = await Chat.find({
        participants: userId,
        $or: [
            { status: 'accepted', messageCount: { $gt: 0 } },
            { status: 'accepted', messageCount: { $exists: false }, preview: { $ne: 'no message yet' } },
            { status: { $exists: false }, messageCount: { $gt: 0 } },
            { status: { $exists: false }, messageCount: { $exists: false }, preview: { $ne: 'no message yet' } },
            { status: 'pending', requestedBy: userId, messageCount: { $gt: 0 } }
        ]
    })
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

    const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
    }).lean();
    if (!chat) {
        const error = new Error('Chat not found');
        error.statusCode = 404;
        throw error;
    }

    const messages = await Message.find({ chatId }).sort({ _id: 1 }).lean();
    const formattedMessages = messages.map(message => enrichMessagePayload(message));
    return { serverMessage: 'messages fetched', messages: formattedMessages };
};

const updateChatDecision = async ({ chatId, userId, decision }) => {
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
        const error = new Error('Invalid chat id');
        error.statusCode = 400;
        throw error;
    }

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) {
        const error = new Error('Chat not found');
        error.statusCode = 404;
        throw error;
    }
    if (decision === 'accepted' && chat.status !== 'pending') {
        const error = new Error('This chat request is no longer pending');
        error.statusCode = 409;
        throw error;
    }
    if (decision === 'accepted' && chat.requestedBy?.toString() === userId.toString()) {
        const error = new Error('Only the receiver can decide this request');
        error.statusCode = 403;
        throw error;
    }

    chat.status = decision;
    if (decision === 'blocked') chat.blockedBy = userId;
    await chat.save();
    return { chatId: chat._id.toString(), status: chat.status };
};

module.exports = {
    sendMessage,
    ensureChat,
    searchChatsByUserId,
    searchChatByChatId,
    updateChatDecision
};
