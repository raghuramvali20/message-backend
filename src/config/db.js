const mongoose = require("mongoose")
const config = require("./config")


const connectDb = async () => {
    try{
        await mongoose.connect(config.db.uri)
        console.log("db is connected successfully");
    }catch(e) {
        console.log("db connection error"+e.message)
        process.exit(1)
    }
}

module.exports = connectDb