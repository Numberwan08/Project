const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const { readdirSync } = require("fs");
const path = require("path");
const http = require("http");
const { setIO } = require("./socket");

dotenv.config();

const app = express();
// Prefer PORT from environment, default to 3000
const port = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(cors());
// Basic rate limiting for posting comments/replies (mitigate spam)
try {
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
  // apply only to API routes that accept content
  app.use('/api/comment', limiter);
  app.use('/api/event', limiter);
  app.use('/api/report', limiter);
} catch (_) {}
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Connected Api sucessfully" });
});

// Load all route modules from the routes directory regardless of CWD
const routesDir = path.join(__dirname, "routes");
readdirSync(routesDir).forEach((name) => {
  try {
    const routePath = path.join(routesDir, name);
    app.use("/api", require(routePath));
    if (process.env.NODE_ENV !== "test") {
      console.log(`Loaded route: ${name}`);
    }
  } catch (err) {
    console.error("Error loading route file:", name, err.message);
  }
});

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
try {
  const { Server } = require("socket.io");
  const io = new Server(server, {
    // Mount under /api/socket.io so it also works behind API proxies
    path: "/api/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
  });
  setIO(io);
  io.on("connection", (socket) => {
    if (process.env.NODE_ENV !== "test") {
      console.log("Socket connected:", socket.id);
    }
    socket.on("disconnect", () => {
      if (process.env.NODE_ENV !== "test") {
        console.log("Socket disconnected:", socket.id);
      }
    });
  });
} catch (e) {
  console.error("Socket.io failed to initialize:", e.message);
}

server.listen(port, () => {
  console.log(`Sever is runnind on port http://localhost:${port}`);
});
