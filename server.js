import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import homeRoutes from "./routes/routes.js";
import authRoutes from "./routes/authRoutes.js";
import protectRoutes from "./routes/protectRoutes.js";
import { crossOrigin } from "./middlewares/corsMiddleware.js";
import path from "path";
import initializeSocket from "./socketHandler.js";
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

initializeSocket(io);

// CORS
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
crossOrigin(app);
app.use("/api", homeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/protect", protectRoutes);

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(
    express.static(path.join(path.dirname(__dirname1), "frontend", "dist"))
  );
  app.get("*", (req, res) => {
    res.sendFile(
      path.resolve(path.dirname(__dirname1), "frontend", "dist", "index.html")
    );
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is up and running!");
  });
}

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server Started on Port: ${PORT}`);
  console.log(` Backend running at: http://localhost:${PORT}`);
  connectDB();
});
