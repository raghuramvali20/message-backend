const mongoose = require('mongoose');
const User = require('../models/user');

const getUserById = async (req, res) => {
    const userId = req.params.id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ serverMessage: "Invalid user id" });
    }

    try {
        const fetchedUser = await User.findById(userId);
        if (!fetchedUser) {
            return res.status(404).json({ serverMessage: "No user found" });
        }

        res.status(200).json({
            user: {
                userName: fetchedUser.userName,
                email: fetchedUser.email,
                profilePic: fetchedUser.profilePic,
                blockedUsers: fetchedUser.blockedUsers
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ serverMessage: "Internal server error" });
    }
};

const searchByUserName = async (req, res) => {
    const userName = req.params.userName;

    if (!userName || userName.length < 3) {
        return res.status(400).json({ serverMessage: "Invalid username" });
    }

    try {
        const regex = new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i");
        const users = await User.find({ userName: regex }).select("_id userName email profilePic");

        if (users.length === 0) {
            return res.status(200).json({ serverMessage: "No user available", users });
        }

        res.status(200).json({
            users
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ serverMessage: "Internal server error" });
    }
};

const blockUser = async (req, res) => {
    const targetUserId = req.params.userId;
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ serverMessage: "Invalid requesting user id" });
    }
    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({ serverMessage: "Invalid user id" });
    }
    if (userId === targetUserId) {
        return res.status(400).json({ serverMessage: "Cannot block yourself" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ serverMessage: "Requesting user not found" });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ serverMessage: "User to block not found" });
        }

        if (!user.blockedUsers.includes(targetUserId)) {
            user.blockedUsers.push(targetUserId);
            await user.save();
        }

        res.status(200).json({ serverMessage: "User blocked successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ serverMessage: "Internal server error" });
    }
};

const unblockUser = async (req, res) => {
    const targetUserId = req.params.userId;
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ serverMessage: "Invalid requesting user id" });
    }
    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({ serverMessage: "Invalid user id" });
    }

    try {
        const result = await User.updateOne(
            { _id: userId },
            { $pull: { blockedUsers: targetUserId } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ serverMessage: "Requesting user not found" });
        }

        if (result.modifiedCount === 0) {
            return res.status(200).json({ serverMessage: "User was not blocked" });
        }

        res.status(200).json({ serverMessage: "User unblocked successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ serverMessage: "Internal server error" });
    }
};

module.exports = { getUserById, searchByUserName, blockUser, unblockUser };