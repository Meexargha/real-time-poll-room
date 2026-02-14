require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const connectDB = require("./config/db");
const pollRoutes = require("./routes/pollRoutes");

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Make io accessible in routes
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/polls", pollRoutes);

// Socket logic
io.on("connection", (socket) => {
  console.log(" User connected:", socket.id);

  socket.on("joinPoll", (pollId) => {
    socket.join(pollId);
    console.log(`User joined room: ${pollId}`);
  });

  socket.on("disconnect", () => {
    console.log(" User disconnected:", socket.id);
  });
});

// Connect DB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
