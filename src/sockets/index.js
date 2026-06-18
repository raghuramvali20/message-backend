const userSockets = {}; 
/* userSockets = {
    user1Id: socket.id1,
    user2Id: socket.id2
}*/

const socketsEvents = (socket, io) => {
   
    socket.on("connect_user", (userId) => {
        userSockets[userId] = socket.id;
        socket.userId = userId;
        console.log(`User ${userId} connected with socket ${socket.id}`)
    })

    socket.on("disconnect", () => {
        delete userSockets[socket.userId]
        console.log("client disconnected");
    })
}

module.exports = { socketsEvents, userSockets }