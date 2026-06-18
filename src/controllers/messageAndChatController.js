const { getIo } = require("../../socket");
const Chat = require("../models/chat");
const Message = require("../models/message");
const User = require("../models/user");
const { userSockets } = require("../sockets");
const encryptMessage = require("../utils/encryption");
const mongoose = require('mongoose');

const sendMessage = async (req, res) => {
    const receiverId = req.params.receiverId;
    const senderId = req.userId;
    const { messageText, date } = req.body;

    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({ message: "Invalid receiver id" });
    }
    if (!senderId || !mongoose.Types.ObjectId.isValid(senderId)) {
        return res.status(400).json({ message: "Invalid sender id" });
    }
    if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ message: "Invalid message" });
    }

    try {
        const receiver = await User.findById(receiverId);
        const sender = await User.findById(senderId);

        if (!receiver) {
            return res.status(404).json({ message: "Receiver does not exist" });
        }
        if (!sender) {
            return res.status(404).json({ message: "Sender does not exist" });
        }
        if (!receiver.publicKey) {
            return res.status(400).json({ message: "Receiver public key is missing" });
        }

        let chat = await Chat.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (!chat) {
            chat = new Chat({
                participants: [senderId, receiverId]
            });
            await chat.save();
        }

        // const cipherTextForReceiver = encryptMessage(text, receiver.publicKey);
        // const cipherTextForSender = encryptMessage(text, sender.publicKey);

        const messageDoc = new Message({
            chatId: chat._id,
            // cipherTextForReceiver,
            // cipherTextForSender,
            messageText,
            timeStamp: date ? new Date(date) : new Date(),
            senderId,
            receiverId
        });
        await messageDoc.save();

        chat.messages.push(messageDoc._id);
        chat.lastUpdate = Date.now();
        await chat.save();

        const receiverSocketId = userSockets[receiverId.toString()];

        if (receiverSocketId) {
            getIo().to(receiverSocketId).emit("newMessage", { message: messageDoc });
        }

        res.status(201).json({
            message: "Message sent",
            messageDoc
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// // accept to continue chat
// const acceptToChat = async (req, res) => {
// }

// decline to chat and block user
// const declineToChat = async (req, res) => {
// }

const searchChatsByUserId = async (req, res) => {
    const userId = req.params.userId;
    console.log("api called")
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user id" });
    }

    try {
        const chatList = await Chat.find({ participants: userId })
            .populate({
                path: 'participants',
                match: { _id: { $ne: userId } },
                select: 'userName profilePic'
            })
            .lean();

        const formattedList = chatList.map(chat => {
            const otherUser = chat.participants[0];
            return {
                id: chat._id,
                userName: otherUser?.userName || '',
                profilePic: otherUser?.profilePic || '',
                receiverId: otherUser?._id?.toString() || ''
            };
        });

        return res.status(200).json({
            chatList: formattedList
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ serverMessage: "Internal server error" });
    }
};


const searchChatByChatId = async (req, res) => {
    const chatId = req.params.chatId;
    const userId = req.userId;

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ message: "Invalid chat id" });
    }

    try {
        const messages = await Message.find({chatId: chatId}).lean();
        res.status(200).json({message: "messages fetched", messages});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};


module.exports = {
    sendMessage,
    /*acceptToChat, declineToChat,*/
    searchChatByChatId,
    searchChatsByUserId
};