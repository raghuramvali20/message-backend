const express = require("express");
const { register, login, getProfile } = require("../controllers/authController");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticateToken, getProfile);
router.get("/profile/:userId", authenticateToken, getProfile);

module.exports = router;