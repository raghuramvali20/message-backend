const {Server} = require("socket.io")
const {socketsEvents} = require("./src/sockets/index.js")

let io;  // ✅ Module-level variable

const initSocket = (server) => { 
    io = new Server(server);  // ✅ Assign to module variable

    io.on("connection", (socket) => {
        console.log("client connected");
        socketsEvents(socket, io)
    })

    return io;
}

const getIo = () => {
    if(!io) throw new Error("Socket io isn't initialized");
    return io;
}
module.exports = { initSocket, getIo };