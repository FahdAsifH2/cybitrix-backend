const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(" User connected:", socket.id);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });
};

export default initializeSocket;
