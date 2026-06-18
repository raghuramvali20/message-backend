const jwt = require("jsonwebtoken");
const config = require("../config/config");

const generateToken = (payload) => {
    const options = {expiresIn: "30d"}
    try{
        return jwt.sign(payload, config.jwt.secretKey, options)
    }catch(err) {
        return null;
    }
}

const verifyToken = (token) => {
    return jwt.verify(token, config.jwt.secretKey) 
}

module.exports = { generateToken, verifyToken };