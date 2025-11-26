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
    ? [
        process.env.CLIENT_PROD_URL,
        // Your Vercel URLs
        "https://cybitrix-frontend-b28y-git-main-fahds-projects-7ffffe31.vercel.app",
        // Vercel also creates preview URLs, so allow all vercel.app domains from your project
        "https://cybitrix-frontend-b28y.vercel.app",
      ].filter(Boolean)
    : ["http://localhost:3000", "http://localhost:5173"];

console.log("🌐 Allowed CORS origins:", allowedOrigins);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

initializeSocket(io);

// CORS
app.use(
  cors({
    origin: allowedOrigins,
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
    res.send("API is up and running! 🚀");
  });
}
console.log("helo");
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
