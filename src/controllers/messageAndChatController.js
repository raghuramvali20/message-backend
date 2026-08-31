const {
    sendMessage: sendMessageService,
    searchChatsByUserId: searchChatsByUserIdService,
    searchChatByChatId: searchChatByChatIdService
} = require('../services/messageService');

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
        const result = await searchChatsByUserIdService(req.params.userId);
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

module.exports = {
    sendMessage,
    searchChatByChatId,
    searchChatsByUserId
};