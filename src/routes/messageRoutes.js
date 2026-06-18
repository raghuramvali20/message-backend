const router = require("express").Router();
const { sendMessage } = require("../controllers/messageAndChatController");
const authenticateToken = require("../middlewares/authenticateToken")

router.post("/send/:receiverId", authenticateToken, sendMessage);

module.exports = router