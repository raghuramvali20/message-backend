const express = require("express");
const { register, login} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register)
router.post("/login", login)

// router.post("/verify-mail", )

module.exports = router
