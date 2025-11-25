import express from "express";
import protect from "../middlewares/authMiddleware.js";
import userVerify from "../middlewares/verifyMiddleware.js";
import { checkLogin } from "../controllers/protectControllers.js";

const router = express.Router();

router.get("/", protect, userVerify, checkLogin);

export default router;
