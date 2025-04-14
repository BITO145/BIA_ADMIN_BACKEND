import { Router } from "express";
import { protect, requireFeature } from "../middlewares/protect.js";
import {
  createChapter,
  createEvent,
  createSubAdmin,
  enrollMember,
  getChapters,
  getEvents,
  getSubAdmins,
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

//fetch subadmins
router.get("/get-subadmin", requireFeature(), getSubAdmins);

//get chapter
router.get("/get-chapter", protect, getChapters);

//get events
router.get("/get-event", protect, getEvents);

export default router;
