import { Router } from "express";
import { requireFeature } from "../middlewares/protect.js";
import {
  createChapter,
  createEvent,
  createSubAdmin,
} from "../controllers/superAdminController.js";

const router = Router();

//create sub-admin
router.post("/sub-admin", requireFeature(), createSubAdmin); //tested

//create chapter
router.post("/chapter", requireFeature("addChapter"), createChapter); //tested

//create event
router.post("/event", requireFeature("addEvent"), createEvent); //tested

export default router;
