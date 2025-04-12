import centralUserModel from "../models/centralUserModel.js";
import chapterModel from "../models/chapterModel.js";
import eventModel from "../models/eventModel.js";
import bcrypt from "bcrypt";
import { sendEventToWebhook } from "../utils/webhookSender.js"; // 

// ✅ Create Subadmin
export const createSubAdmin = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Only superadmins can create subadmins" });
    }

    const existingUser = await centralUserModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email or username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newSubAdmin = await centralUserModel.create({
      name,
      email,
      username,
      password: hashedPassword,
      role: "subadmin",
      createdBy: req.user.id,
    });

    res.status(201).json({ message: "Subadmin created successfully", user: newSubAdmin });
  } catch (error) {
    console.error("Error creating subadmin:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Create Chapter
export const createChapter = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (
      req.user.role !== "superadmin" &&
      !req.user.allowedFeatures?.some(
        (feature) => feature.feature === "addChapter" && feature.allowed
      )
    ) {
      return res.status(403).json({ error: "You do not have permission to create a chapter" });
    }

    const { chapterName, zone, description, chapterLeadName } = req.body;
    if (!chapterName || !zone || !chapterLeadName) {
      return res.status(400).json({
        error: "chapterName, zone, and chapterLeadName are required fields",
      });
    }

    const newChapter = await chapterModel.create({
      chapterName,
      zone,
      description,
      chapterLeadName,
    });

    res.status(201).json({ message: "Chapter created successfully", chapter: newChapter });
  } catch (error) {
    console.error("Error creating chapter:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Create Event + Webhook
export const createEvent = async (req, res) => {
  try {
    const {
      eventName,
      eventStartTime,
      eventEndTime,
      eventDate,
      location,
      description,
      membershipRequired,
      chapter,
    } = req.body;

    if (
      !eventName ||
      !eventStartTime ||
      !eventEndTime ||
      !eventDate ||
      !location ||
      !chapter
    ) {
      return res.status(400).json({
        error: "Please provide eventName, eventStartTime, eventEndTime, eventDate, location, and chapter.",
      });
    }

    const chapterDoc = await chapterModel.findById(chapter);
    if (!chapterDoc) {
      return res.status(404).json({ error: "Chapter not found." });
    }

    const newEvent = await eventModel.create({
      eventName,
      eventStartTime,
      eventEndTime,
      eventDate,
      location,
      description,
      membershipRequired,
      chapter,
    });

    await chapterModel.findByIdAndUpdate(
      chapter,
      { $push: { events: newEvent._id } },
      { new: true }
    );

    // ✅ Send Webhook
    await sendEventToWebhook({
      _id: newEvent._id,
      eventName,
      eventStartTime,
      eventEndTime,
      eventDate,
      location,
      description,
      membershipRequired,
      chapterName: chapterDoc.chapterName,
      zone: chapterDoc.zone,
    });

    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Enroll Member
export const enrollMember = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ error: "memberId is required" });
    }

    const updatedChapter = await chapterModel.findByIdAndUpdate(
      chapterId,
      { $addToSet: { members: memberId } },
      { new: true }
    );

    if (!updatedChapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    res.status(200).json({
      message: "Member enrolled in chapter successfully",
      chapter: updatedChapter,
    });
  } catch (error) {
    console.error("Error enrolling member in chapter:", error);
    res.status(500).json({ error: "Server error" });
  }
};
