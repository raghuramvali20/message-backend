const { verifyToken } = require("../utils/jwt");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            message: "Missing or invalid Authorization header"
        })
    }

    const token = authHeader.split(" ")[1];
    try{
        const decode = verifyToken(token)
        req.userId = decode.id;
        next();
    }catch(err) {
        return res.status(403).json({message: "Invalid or expired Token"})
    }
}

module.exports = authenticateToken;