const { ensureChat, searchChatsByUserId, searchChatByChatId, acceptChat, blockChat } = require("../controllers/messageAndChatController");
const authenticateToken = require('../middlewares/authenticateToken');

const router = require("express").Router();

router.post("/:chatId/accept", authenticateToken, acceptChat);
router.post("/:chatId/block", authenticateToken, blockChat);

router.get("/by-user/:userId", authenticateToken, searchChatsByUserId);
router.get("/by-chat/:chatId", authenticateToken, searchChatByChatId);
router.post("/with/:userId", authenticateToken, ensureChat);

module.exports = router;