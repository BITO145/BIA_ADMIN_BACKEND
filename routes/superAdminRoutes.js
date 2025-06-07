import { Router } from "express";
import { protect, requireFeature } from "../middlewares/protect.js";
import {
  createChapter,
  createEvent,
  createOpp,
  createSubAdmin,
  deleteChapter,
  deleteEvent,
  enrollMember,
  enrollMemberInEvent,
  getChapters,
  getEvents,
  getOpp,
  getSubAdmins,
  receiveOpportunityEnrollment,
  updateMemberRole,
} from "../controllers/superAdminController.js";
import upload from "../middlewares/multer.js";

const router = Router();

//create sub-admin
router.post("/sub-admin", requireFeature(), createSubAdmin); //tested

//create chapter
router.post(
  "/chapter",
  requireFeature("addChapter"),
  upload.single("image"),
  createChapter
); //tested

//create event
router.post(
  "/event",
  requireFeature("addEvent"),
  upload.single("image"),
  createEvent
); //tested

//enroll member
router.post("/chapters/:chapterId/enrollMember", enrollMember);

//enroll member in event
router.post("/events/:eventId/enrollMember", enrollMemberInEvent);

//enroll memeber in opp
router.post("/webhook/opportunity-enroll", receiveOpportunityEnrollment);

//fetch subadmins
router.get("/get-subadmin", requireFeature(), getSubAdmins);

//get chapter
router.get("/get-chapter", protect, getChapters);

//get events
router.get("/get-event", protect, getEvents);

//get opp
router.get("/get-opp", protect, getOpp);

//update user role
router.post("/updaterole", protect, updateMemberRole);

//delete chapter
router.post("/delChap/:chapterId", protect, deleteChapter);

//delete event
router.post("/delEvent/:eventId", protect, deleteEvent);

//create opp
router.post(
  "/createOpp",
  upload.single("image"),
  protect,
  requireFeature("addOpp"),

  createOpp
);

export default router;
