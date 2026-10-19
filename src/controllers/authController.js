const { registerUser, loginUser, getUser } = require('../services/authService');

const register = async (req, res) => {
    try {
        const result = await registerUser(req.body);
        return res.status(201).json(result);
    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            serverMessage: err.message || 'Internal server error'
        });
    }
};

const login = async (req, res) => {
    try {
        const result = await loginUser(req.body);
        return res.status(200).json(result);
    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            serverMessage: err.message || 'Internal server error'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.params.userId || req.userId;
        const result = await getUser(userId);
        return res.status(200).json(result);
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            serverMessage: err.message || 'Internal server error'
        });
    }
};

module.exports = { register, login, getProfile };