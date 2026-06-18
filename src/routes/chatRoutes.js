const { acceptToChat, declineToChat, searchChatsByUserId, searchChatByChatId } = require("../controllers/messageAndChatController");
const authenticateToken = require('../middlewares/authenticateToken');

const router = require("express").Router();

// router.post("/:chatId/accept", authenticateToken,acceptToChat);

// router.post("/:chatId/decline", authenticateToken,declineToChat);

router.get("/by-user/:userId", authenticateToken, searchChatsByUserId);
router.get("/by-chat/:chatId", authenticateToken, searchChatByChatId);

module.exports = router;