const User = require('../models/user');
const Message = require('../models/message');
const Chat = require('../models/chat');

const userSockets = {}; 
/* userSockets = {
    user1Id: socket.id1,
    user2Id: socket.id2
}*/

const socketsEvents = (socket, io) => {
    socket.on("connect_user", async (userId) => {
        if (!userId || !await User.exists({ _id: userId })) return;

        userSockets[userId] = socket.id;
        socket.userId = userId;

        await User.findByIdAndUpdate(userId, {
            online: true,
            lastSeen: null,
        }, { new: true });

        io.emit('user_online', {
            userId,
            online: true,
            lastSeen: null,
        });

        console.log(`User ${userId} connected with socket ${socket.id}`);
    });

    socket.on("disconnect", async () => {
        const userId = socket.userId;
        if (!userId) {
            console.log('client disconnected');
            return;
        }

        delete userSockets[userId];

        await User.findByIdAndUpdate(userId, {
            online: false,
            lastSeen: new Date(),
        }, { new: true });

        io.emit('user_offline', {
            userId,
            online: false,
            lastSeen: new Date().toISOString(),
        });

        console.log(`User ${userId} disconnected`);
    });

    socket.on('user_typing', ({ chatId, senderId, receiverId }) => {
        if (!chatId || !senderId || !receiverId) return;

        const targetSocketId = userSockets[receiverId];
        if (targetSocketId && targetSocketId !== socket.id) {
            io.to(targetSocketId).emit('user_typing', {
                chatId,
                senderId,
                receiverId,
                isTyping: true,
            });
        }
    });

    socket.on('user_stopped_typing', ({ chatId, senderId, receiverId }) => {
        if (!chatId || !senderId || !receiverId) return;

        const targetSocketId = userSockets[receiverId];
        if (targetSocketId && targetSocketId !== socket.id) {
            io.to(targetSocketId).emit('user_stopped_typing', {
                chatId,
                senderId,
                receiverId,
                isTyping: false,
            });
        }
    });

    socket.on('message_seen', async ({ messageId, chatId, userId, senderId }) => {
        if (!messageId || !chatId || !userId || !senderId) return;
        if (socket.userId !== userId) return;

        const chat = await Chat.findOne({ _id: chatId, participants: userId }).select('_id');
        if (!chat) return;

        const message = await Message.findOneAndUpdate({
            _id: messageId,
            chatId,
            receiverId: userId,
            senderId
        }, {
            status: 'seen',
        }, { new: true });
        if (!message) return;

        const senderSocketId = userSockets[message.senderId.toString()];
        if (senderSocketId) {
            io.to(senderSocketId).emit('message_seen', {
                messageId,
                chatId,
                userId,
                senderId: message.senderId.toString(),
                status: 'seen',
            });
        }
    });
}

module.exports = { socketsEvents, userSockets }