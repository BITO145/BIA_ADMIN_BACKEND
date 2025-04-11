import { Router } from "express";
import { requireFeature } from "../middlewares/protect.js";
import {
  createChapter,
  createEvent,
  createSubAdmin,
  enrollMember,
} from "../controllers/superAdminController.js";

const router = Router();

//create sub-admin
router.post("/sub-admin", requireFeature(), createSubAdmin); //tested

//create chapter
router.post("/chapter", requireFeature("addChapter"), createChapter); //tested

//create event
router.post("/event", requireFeature("addEvent"), createEvent); //tested

//enroll member
router.post("/chapters/:chapterId/enrollMember", enrollMember);

export default router;
