const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const User = require("../models/user");
const { generateToken } = require("../utils/jwt");

const register = async (req, res) => {
    const { userName, email, password, publicKey } = req.body;

    if (!userName || !email || !password || !publicKey) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User({ userName, email, passwordHash, publicKey });
        await user.save();

        const token = generateToken({ id: user._id });

        res.status(201).json({
            message: "Account created successfully",
            token,
            user: {
                id: user._id,
                userName: user.userName,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

const login = async (req, res) => {
    console.log("requested")
    const { email, password, publicKey } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found, create new account" });
        }

        const isMatch = await bcrypt.compare(password, existingUser.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: "Unauthorized, password is incorrect" });
        }

        if (publicKey) {
            existingUser.publicKey = publicKey;
            await existingUser.save();
        }

        const token = generateToken({ id: existingUser._id });

        res.status(200).json({
            message: "User authorized",
            token,
            user: {
                id: existingUser._id,
                userName: existingUser.userName,
                email: existingUser.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { register, login };