const User = require("../models/user");
const encryptMessage = require("../utils/encryption");

const keyValidator = async (req, res) => {
    const {payload} = req.body;
    const userId = req.userId;
    
    try{
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({serverMessage: "User not exist"});  // ✅ Add return
        }
        const publicKey = user.publicKey;
        const cipherText = encryptMessage(payload, publicKey);
        return res.status(200).json({serverMessage: "Encrypted successfully", cipherText});  // ✅ Add return
    } catch(err) {  // ✅ Add error parameter
        console.error(err);
        return res.status(500).json({serverMessage: "Internal server error"});  // ✅ Use .status()
    }

}
module.exports = {keyValidator}