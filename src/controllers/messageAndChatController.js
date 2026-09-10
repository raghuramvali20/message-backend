const {
    sendMessage: sendMessageService,
    ensureChat: ensureChatService,
    searchChatsByUserId: searchChatsByUserIdService,
    searchChatByChatId: searchChatByChatIdService,
    updateChatDecision: updateChatDecisionService
} = require('../services/messageService');

const ensureChat = async (req, res) => {
    try {
        const chat = await ensureChatService({
            userId: req.userId,
            otherUserId: req.params.userId
        });
        return res.status(200).json({ chat });
    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            serverMessage: err.message || 'Internal server error'
        });
    }
};

const sendMessage = async (req, res) => {
    try {
        const result = await sendMessageService({
            senderId: req.userId,
            receiverId: req.params.receiverId,
            messageText: req.body.messageText
        });
        return res.status(201).json(result);
    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            serverMessage: err.message || 'Internal server error'
        });
    }
};

const searchChatsByUserId = async (req, res) => {
    try {
        const result = await searchChatsByUserIdService(req.userId);
        return res.status(200).json(result);
    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            serverMessage: err.message || 'Internal server error'
        });
    }
};

const searchChatByChatId = async (req, res) => {
    try {
        const result = await searchChatByChatIdService({
            chatId: req.params.chatId,
            userId: req.userId
        });
        return res.status(200).json(result);
    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            serverMessage: err.message || 'Internal server error'
        });
    }
};

const acceptChat = async (req, res) => {
    try {
        const result = await updateChatDecisionService({
            chatId: req.params.chatId,
            userId: req.userId,
            decision: 'accepted'
        });
        return res.status(200).json(result);
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ serverMessage: err.message || 'Unable to accept chat' });
    }
};

const blockChat = async (req, res) => {
    try {
        const result = await updateChatDecisionService({
            chatId: req.params.chatId,
            userId: req.userId,
            decision: 'blocked'
        });
        return res.status(200).json(result);
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ serverMessage: err.message || 'Unable to block chat' });
    }
};

module.exports = {
    sendMessage,
    ensureChat,
    searchChatByChatId,
    searchChatsByUserId,
    acceptChat,
    blockChat
};