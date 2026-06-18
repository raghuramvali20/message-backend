const express = require("express");
const User = require("./src/models/user");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const messageRoutes = require("./src/routes/messageRoutes")
const keyValidator = require("./src/routes/keyValidator");
const cors = require('cors');

const app = express();

app.use(cors())

app.use(express.json())

app.get("/", (req, res) => {
   res.status(200).json({message: "this is server message"})
})

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/chats", chatRoutes)
app.use("/message", messageRoutes)
app.use("/health", keyValidator)

module.exports = app
