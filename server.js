const http = require("http")
const app = require("./app")
const { initSocket } = require("./socket")
const connectDb = require("./src/config/db")


connectDb();

const server = http.createServer(app)

initSocket(server)

server.listen(3000, () => {
    console.log("running")
})

module.exports = server