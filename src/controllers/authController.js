const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const User = require("../models/user");
const { generateToken } = require("../utils/jwt");

const register = async (req, res) => {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
        return res.status(400).json({ serverMessage: "Missing required fields" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ serverMessage: "Email already registered" });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User({ userName, email, passwordHash});
        await user.save();

        const token = generateToken({ id: user._id });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                userName: user.userName,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ serverMessage: "Internal server error" });
    }
};

const login = async (req, res) => {
    const {email, password} = req.body;
     console.log(email + " "+ password + " login request");

    if (!email || !password) {
        return res.status(400).json({ serverMessage: "Email and password are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        console.log(existingUser);
        if (!existingUser) {
            return res.status(404).json({ serverMessage: "User not found, create new account" });
        }

        const isMatch = await bcrypt.compare(password, existingUser.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ serverMessage: "Unauthorized, password is incorrect" });
        }

        const token = generateToken({ id: existingUser._id });

        res.status(200).json({
            token,
            user: {
                id: existingUser._id,
                userName: existingUser.userName,
                email: existingUser.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ serverMessage: "Internal server error" });
    }
};

module.exports = { register, login };