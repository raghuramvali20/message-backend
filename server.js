const http = require("http")
const app = require("./app")
const { initSocket } = require("./socket")
const connectDb = require("./src/config/db")


connectDb();

const server = http.createServer(app)

initSocket(server)

const port = Number(process.env.PORT || 3000)

server.listen(port, () => {
    console.log(`running on port ${port}`)
})

module.exports = server