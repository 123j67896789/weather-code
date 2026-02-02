const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

/* ================= STORAGE ================= */
// In-memory (replace with DB later)
let warnings = [];

/* ================= REST API ================= */
app.get("/warnings", (req, res) => {
  res.json(warnings);
});

app.post("/warnings", (req, res) => {
  const warning = {
    id: Date.now().toString(),
    ...req.body,
    created: Date.now()
  };

  warnings.push(warning);
  io.emit("new-warning", warning); //  broadcast to all users

  res.status(201).json(warning);
});

/* ================= SOCKET.IO ================= */
io.on("connection", socket => {
  console.log("Client connected");

  // Send all existing warnings on connect
  socket.emit("init-warnings", warnings);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

/* ================= START ================= */
const PORT = 3000;
server.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`)
);
