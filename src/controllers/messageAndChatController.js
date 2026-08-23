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
    const { messageText} = req.body; //time is string in the form of  "2026-06-21T06:25:59.835Z"

    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({ serverMessage: "Invalid receiver id" });
    }
    if (!senderId || !mongoose.Types.ObjectId.isValid(senderId)) {
        return res.status(400).json({ serverMessage: "Invalid sender id" });
    }
    if (!messageText || typeof messageText !== "string" || messageText.trim().length === 0) {
        return res.status(400).json({ serverMessage: "Invalid message" });
    }

    try {
        const receiver = await User.findById(receiverId);
        const sender = await User.findById(senderId);

        if (!receiver) {
            return res.status(404).json({ serverMessage: "Receiver does not exist" });
        }
        if (!sender) {
            return res.status(404).json({ serverMessage: "Sender does not exist" });
        }
        if (!receiver.publicKey) {
            return res.status(400).json({ serverMessage: "Receiver public key is missing" });
        }

        let chat = await Chat.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!chat) {
            chat = new Chat({
                participants: [senderId, receiverId],
                preview: messageText,
                lastUpdate: new Date().toISOString()
            });
            await chat.save();
        }else {
            chat.preview = messageText;
            chat.lastUpdate = new Date().toISOString();
            await chat.save();
        }

        // const cipherTextForReceiver = encryptMessage(text, receiver.publicKey);
        // const cipherTextForSender = encryptMessage(text, sender.publicKey);

        const messageDoc = new Message({
            chatId: chat._id,
            // cipherTextForReceiver,
            // cipherTextForSender,
            messageText,
            time: new Date().toISOString(),
            senderId,   
            receiverId
        });
        await messageDoc.save();
        // chat.messages ??= [];
        // chat.messages.push(messageDoc._id);
        // chat.lastUpdate = Date.now();
        // await chat.save();

        const receiverSocketId = userSockets[receiverId.toString()];

        if (receiverSocketId) {
            getIo().to(receiverSocketId).emit("newMessage", { serverMessage: messageDoc });
        }

        res.status(201).json({
            messageDoc
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ serverMessage: "Internal server error" });
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
        return res.status(400).json({ serverMessage: "Invalid user id" });
    }

    try {
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
                receiverId: otherUser?._id?.toString() || '',
            };
        });
        console.log(formattedList)
    
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

    console.log("called");

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ serverMessage: "Invalid chat id" });
    }

    try {
        const messages = await Message.find({chatId: chatId}).lean();
        res.status(200).json({serverMessage: "messages fetched", messages});
    } catch (err) {
        console.error(err);
        res.status(500).json({ serverMessage: "Internal server error" });
    }
};


module.exports = {
    sendMessage,
    /*acceptToChat, declineToChat,*/
    searchChatByChatId,
    searchChatsByUserId
};