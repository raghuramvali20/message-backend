const bcrypt = require('bcrypt');
const User = require('../models/user');
const { generateToken } = require('../utils/jwt');

const registerUser = async ({ userName, email, password }) => {
    if (!userName || !email || !password) {
        const error = new Error('Missing required fields');
        error.statusCode = 400;
        throw error;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const error = new Error('Email already registered');
        error.statusCode = 400;
        throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ userName, email, passwordHash });
    await user.save();

    const token = generateToken({ id: user._id });

    return {
        token,
        user: {
            id: user._id,
            userName: user.userName,
            email: user.email
        }
    };
};

const loginUser = async ({ email, password }) => {
    if (!email || !password) {
        const error = new Error('Email and password are required');
        error.statusCode = 400;
        throw error;
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        const error = new Error('User not found, create new account');
        error.statusCode = 404;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, existingUser.passwordHash);
    if (!isMatch) {
        const error = new Error('Unauthorized, password is incorrect');
        error.statusCode = 401;
        throw error;
    }

    const token = generateToken({ id: existingUser._id });

    return {
        token,
        user: {
            id: existingUser._id,
            userName: existingUser.userName,
            email: existingUser.email
        }
    };
};

module.exports = { registerUser, loginUser };
