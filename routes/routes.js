import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("API is up and running");
});

export default router;
