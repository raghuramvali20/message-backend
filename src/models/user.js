const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserModel = new Schema({
    userName: {
        type: String,
        unique: true,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: {
        type: String, 
        required: true
    },
    profilePic : {
        type: String
    },
    online: {
        type: Boolean,
        default: false,
    },
    lastSeen: {
        type: Date,
        default: null,
    },
    blockedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "User",
    }]
});

const User = mongoose.model("User", UserModel);
module.exports = User;