const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const { error } = require("console");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let url = "mongodb://localhost:27017/Websocket";

// Use CORS middleware with specified options
app.use(cors());
mongoose
  .connect(url)
  .then(() => {
    console.log("Db i connected");
  })
  .catch((error) => console.log(error));

const chatSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Chat = mongoose.model("Chat", chatSchema);

app.use(express.json());

// Endpoint to post a new message
app.post("/api/messages", async (req, res) => {
  const { username, message } = req.body;
  const chat = new Chat({ username, message });
  await chat.save();
  io.emit("receiveMessage", { username, message });
  res.status(201).send(chat);
});

// Endpoint to get all messages
app.get("/api/messages", async (req, res) => {
  const messages = await Chat.find();
  res.status(200).send(messages);
});

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("sendMessage", async ({ username, message }) => {
    const chat = new Chat({ username, message });
    await chat.save();
    io.emit("receiveMessage", { username, message });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
