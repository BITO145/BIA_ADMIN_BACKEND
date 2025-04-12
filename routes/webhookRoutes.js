import express from "express";
import { receiveEvent } from "../controllers/eventWebhookController.js";

const router = express.Router();

// Route to receive event from webhook
router.post("/events/receive", receiveEvent);

export default router;
