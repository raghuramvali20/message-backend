const {
    getUserById: getUserByIdService,
    searchByUserName: searchByUserNameService,
    blockUser: blockUserService,
    unblockUser: unblockUserService
} = require('../services/userService');

const getUserById = async (req, res) => {
    try {
        const result = await getUserByIdService(req.params.id);
        return res.status(200).json(result);
    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            serverMessage: err.message || 'Internal server error'
        });
    }
};

const searchByUserName = async (req, res) => {
    try {
        const result = await searchByUserNameService(req.params.userName);
        if (result.serverMessage) {
            return res.status(200).json(result);
        }
        return res.status(200).json(result);
    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            serverMessage: err.message || 'Internal server error'
        });
    }
};

const blockUser = async (req, res) => {
    try {
        const result = await blockUserService({
            userId: req.userId,
            targetUserId: req.params.userId
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

const unblockUser = async (req, res) => {
    try {
        const result = await unblockUserService({
            userId: req.userId,
            targetUserId: req.params.userId
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

module.exports = { getUserById, searchByUserName, blockUser, unblockUser };