const router = require("express").Router();
const authenticateToken = require('../middlewares/authenticateToken');
const { searchByUserName, getUserById, blockUser, unblockUser } = require("../controllers/userController");

router.get("/search/:userName", authenticateToken, searchByUserName)

router.get("/:id", authenticateToken, getUserById)

router.post("/block/:userId", authenticateToken, blockUser)  // ✅ Changed :id to :userId

router.post("/unblock/:userId", authenticateToken, unblockUser)  // ✅ Changed :id to :userId

module.exports = router;