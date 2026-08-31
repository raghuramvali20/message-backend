const mongoose = require('mongoose');
const User = require('../models/user');

const getUserById = async (userId) => {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        const error = new Error('Invalid user id');
        error.statusCode = 400;
        throw error;
    }

    const fetchedUser = await User.findById(userId);
    if (!fetchedUser) {
        const error = new Error('No user found');
        error.statusCode = 404;
        throw error;
    }

    return {
        user: {
            userName: fetchedUser.userName,
            email: fetchedUser.email,
            profilePic: fetchedUser.profilePic,
            blockedUsers: fetchedUser.blockedUsers
        }
    };
};

const searchByUserName = async (userName) => {
    if (!userName || userName.length < 3) {
        const error = new Error('Invalid username');
        error.statusCode = 400;
        throw error;
    }

    const regex = new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({ userName: regex }).select('_id userName email profilePic');

    return {
        serverMessage: users.length === 0 ? 'No user available' : undefined,
        users
    };
};

const blockUser = async ({ userId, targetUserId }) => {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        const error = new Error('Invalid requesting user id');
        error.statusCode = 400;
        throw error;
    }
    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
        const error = new Error('Invalid user id');
        error.statusCode = 400;
        throw error;
    }
    if (userId === targetUserId) {
        const error = new Error('Cannot block yourself');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
        const error = new Error('Requesting user not found');
        error.statusCode = 404;
        throw error;
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
        const error = new Error('User to block not found');
        error.statusCode = 404;
        throw error;
    }

    if (!user.blockedUsers.includes(targetUserId)) {
        user.blockedUsers.push(targetUserId);
        await user.save();
    }

    return { serverMessage: 'User blocked successfully' };
};

const unblockUser = async ({ userId, targetUserId }) => {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        const error = new Error('Invalid requesting user id');
        error.statusCode = 400;
        throw error;
    }
    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
        const error = new Error('Invalid user id');
        error.statusCode = 400;
        throw error;
    }

    const result = await User.updateOne(
        { _id: userId },
        { $pull: { blockedUsers: targetUserId } }
    );

    if (result.matchedCount === 0) {
        const error = new Error('Requesting user not found');
        error.statusCode = 404;
        throw error;
    }

    if (result.modifiedCount === 0) {
        return { serverMessage: 'User was not blocked' };
    }

    return { serverMessage: 'User unblocked successfully' };
};

module.exports = {
    getUserById,
    searchByUserName,
    blockUser,
    unblockUser
};
