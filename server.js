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

// Configure allowed origins based on environment
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? (origin, callback) => {
        // Allow all Vercel URLs for your project
        if (
          !origin ||
          origin.includes("cybitrix-frontend") ||
          origin.includes("vercel.app")
        ) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    : ["http://localhost:3000", "http://localhost:5173"];

console.log("🌐 CORS enabled for Vercel domains");

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.includes("cybitrix-frontend") ||
        origin.includes("vercel.app") ||
        origin.includes("localhost")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
});

initializeSocket(io);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.includes("cybitrix-frontend") ||
        origin.includes("vercel.app") ||
        origin.includes("localhost")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
crossOrigin(app);
app.use("/api", homeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/protect", protectRoutes);

const __dirname1 = path.resolve();
app.get("/", (req, res) => {
  res.send("API is up and running! 🚀");
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server Started on Port: ${PORT}`);
  console.log(`📡 Backend running at: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔐 JWT_SECRET is ${process.env.JWT_SECRET ? "LOADED ✅" : "MISSING ❌"}`
  );
  connectDB();
});
