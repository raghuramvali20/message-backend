const { keyValidator } = require("../controllers/keyValidationController");
const authenticateToken = require("../middlewares/authenticateToken")

const router = require("express").Router()

router.post("/key-validator", authenticateToken, keyValidator);

module.exports = router;