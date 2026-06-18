require('dotenv').config();

const config = {
    db : {
        uri : process.env.DB_URI
    },
    jwt : {
        secretKey: process.env.JWT_SECRET_KEY
    }
}

module.exports = Object.freeze(config);