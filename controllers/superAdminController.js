import centralUserModel from "../models/centralUserModel.js";
import chapterModel from "../models/chapterModel.js";
import eventModel from "../models/eventModel.js";
import opportunityModel from "../models/opportunityModel.js";
import bcrypt from "bcrypt";
import {
  sendEventToWebhook,
  sendChapterToWebhook,
} from "../utils/webhookSender.js";
import axios from "axios";
import cloudinary from "cloudinary";
import fs from "fs";

const memUri = process.env.MEM_URI;

// ✅ Create Subadmin
export const createSubAdmin = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    if (req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({ error: "Only superadmins can create subadmins" });
    }

    const existingUser = await centralUserModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email or username already exists" });
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

    res
      .status(201)
      .json({ message: "Subadmin created successfully", user: newSubAdmin });
  } catch (error) {
    console.error("Error creating subadmin:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Create Chapter + Webhook
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
      return res
        .status(403)
        .json({ error: "No permission to create a chapter" });
    }

    const { chapterName, zone, description, chapterLeadName } = req.body;
    if (!chapterName || !zone || !chapterLeadName) {
      return res.status(400).json({
        error: "chapterName, zone, and chapterLeadName are required.",
      });
    }

    let chapterImageUrl = null;

    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "chapter-images",
      });
      chapterImageUrl = result.secure_url;

      fs.unlinkSync(req.file.path);
    }

    const newChapter = await chapterModel.create({
      chapterName,
      zone,
      description,
      chapterLeadName,
      image: chapterImageUrl,
    });

    await sendChapterToWebhook({
      hmrsChapterId: newChapter._id,
      chapterName: newChapter.chapterName,
      zone: newChapter.zone,
      description: newChapter.description,
      chapterLeadName: newChapter.chapterLeadName,
      image: newChapter.image,
      events: newChapter.events,
      members: newChapter.members.map((m) => ({
        memberId: m.memberId,
        name: m.name,
      })),
      createdAt: newChapter.createdAt,
    });

    res.status(201).json({
      success: true,
      message: "Chapter created successfully",
      chapter: newChapter,
    });
  } catch (error) {
    console.error("Error creating chapter:", error);

    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete uploaded file:", err);
      });
    }

    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Delete Chapter
export const deleteChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;

    if (!chapterId) {
      return res.status(400).json({ error: "chapterId is required." });
    }

    // Check if chapter exists
    const chapter = await chapterModel.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found." });
    }

    // Delete the chapter locally (admin panel DB)
    await chapterModel.findByIdAndDelete(chapterId);

    // Send webhook to membership portal to delete chapter there
    const membershipPortalWebhookUrl = `${memUri}/webhook/deleteChapter`;
    const webhookResponse = await axios.post(membershipPortalWebhookUrl, {
      hmrsChapterId: chapter._id.toString(),
    });

    if (webhookResponse.status !== 200) {
      console.warn("Chapter deleted locally, but webhook failed.");
      return res.status(207).json({
        message:
          "Chapter deleted locally, but webhook to membership portal failed.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Chapter deleted successfully from both systems.",
    });
  } catch (error) {
    console.error("Error deleting chapter:", error);
    res.status(500).json({ error: "Server error while deleting chapter." });
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

    // Validate required fields
    if (
      !eventName ||
      !eventStartTime ||
      !eventEndTime ||
      !eventDate ||
      !location ||
      !chapter
    ) {
      return res.status(400).json({
        error:
          "Please provide eventName, eventStartTime, eventEndTime, eventDate, location, and chapter.",
      });
    }

    let eventImageUrl = null;

    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "event-images",
      });
      eventImageUrl = result.secure_url;

      fs.unlinkSync(req.file.path);
    }

    if (!eventImageUrl) {
      return res.status(400).json({ error: "Event image is required." });
    }

    // Extract the date portion
    const datePortion = eventDate.split("T")[0];
    const eventStartDateTime = new Date(`${datePortion}T${eventStartTime}:00Z`);
    const eventEndDateTime = new Date(`${datePortion}T${eventEndTime}:00Z`);

    // Verify that the chapter exists
    const chapterDoc = await chapterModel.findById(chapter);
    if (!chapterDoc) {
      return res.status(404).json({ error: "Chapter not found." });
    }

    // Create the event
    const newEvent = await eventModel.create({
      eventName,
      eventStartTime: eventStartDateTime,
      eventEndTime: eventEndDateTime,
      eventDate: new Date(eventDate),
      location,
      description,
      membershipRequired,
      chapter,
      image: eventImageUrl,
    });

    // Push event into the chapter
    await chapterModel.findByIdAndUpdate(
      chapter,
      { $push: { events: newEvent._id } },
      { new: true }
    );

    // Send webhook
    await sendEventToWebhook({
      hmrsEventId: newEvent._id,
      eventName,
      eventStartTime: eventStartDateTime,
      eventEndTime: eventEndDateTime,
      eventDate: new Date(eventDate),
      location,
      description,
      membershipRequired,
      chapter: chapterDoc._id,
      image: eventImageUrl,
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);

    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete uploaded file:", err);
      });
    }

    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Delete Event
export const deleteEvent = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId) {
    return res.status(400).json({ error: "eventId is required." });
  }

  try {
    // Step 1: Find the event
    const event = await eventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    const chapterId = event.chapter;

    // Step 2: Delete the event from Event collection (admin DB)
    await eventModel.findByIdAndDelete(eventId);

    // Step 3: Remove the event from the Chapter's events array
    await chapterModel.findByIdAndUpdate(
      chapterId,
      { $pull: { events: eventId } },
      { new: true }
    );

    console.log("✅ Event removed locally (Event & Chapter models)");
    console.log("-->", eventId, chapterId);
    // Step 4: Send request to membership portal to delete the same event
    await axios.post(`${memUri}/webhook/deleteEvent`, {
      eventId,
      chapterId, // send the MongoDB ObjectId from admin portal
    });

    res.status(200).json({
      success: true,
      message: "Event deleted successfully from both systems.",
    });
  } catch (error) {
    console.error("❌ Error deleting event:", error.message);
    res
      .status(500)
      .json({ error: "Internal server error while deleting event." });
  }
};

// ✅ Enroll Member
export const enrollMember = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { memberId, name, email, phone, role } = req.body;

    if (!memberId || !name || !email || !role) {
      return res.status(400).json({
        error: "memberId, name, email and role are required",
      });
    }

    const memberObj = { memberId, name, email, phone, role };

    const updatedChapter = await chapterModel.findByIdAndUpdate(
      chapterId,
      { $addToSet: { members: memberObj } },
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

// ✅ fetch subadmins
export const getSubAdmins = async (req, res) => {
  try {
    // Fetch all users with role "subadmin", only selecting username, email, and role fields.
    const subAdmins = await centralUserModel
      .find({ role: "subadmin" })
      .select("name username email role")
      .lean();

    // Map each subadmin document to a new object with "id" instead of _id.
    const formattedSubAdmins = subAdmins.map((admin) => ({
      id: admin._id.toString(),
      name: admin.name,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    }));

    res.status(200).json({ subAdmins: formattedSubAdmins });
  } catch (error) {
    console.error("Error fetching subadmins:", error);
    res.status(500).json({ error: "Server error fetching subadmins." });
  }
};

// ✅ fetch chapters
export const getChapters = async (req, res) => {
  try {
    // Find all chapters, populate the events field, and use lean() to return plain objects.
    const chapters = await chapterModel.find({}).populate("events").lean();

    res.status(200).json({ chapters });
  } catch (error) {
    console.error("Error fetching chapters:", error);
    res.status(500).json({ error: "Server error fetching chapters." });
  }
};

// ✅ fetch events
export const getEvents = async (req, res) => {
  try {
    const events = await eventModel
      .find({})
      .populate("chapter", "chapterName zone chapterLeadName") // populate only select fields from Chapter
      .lean();

    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Server error fetching events." });
  }
};

// ✅  handle the role update in Admin Dashboard
export const updateMemberRole = async (req, res) => {
  try {
    const { memberId, chapterId, newRole } = req.body;
    console.log("Received body:", req.body);

    if (!memberId || !chapterId || !newRole) {
      return res.status(400).json({
        error: "memberId, chapterId and newRole are all required",
      });
    }

    const chapter = await chapterModel.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    const memberIndex = chapter.members.findIndex(
      (member) => member.memberId === memberId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ error: "Member not found in chapter" });
    }

    // Update the member's role in the chapter
    chapter.members[memberIndex].role = newRole;
    await chapter.save();

    // forward the chapter-scoped update to the membership portal
    const membershipPortalWebhookUrl = `${memUri}/webhook/updateRole`;
    const webhookResponse = await axios.post(membershipPortalWebhookUrl, {
      memberId,
      chapterId,
      newRole,
    });

    if (webhookResponse.status === 200) {
      return res.status(200).json({
        message: "Webhook sent successfully",
      });
    } else {
      throw new Error("Membership portal returned non-200");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ create opportunity
export const createOpp = async (req, res) => {
  try {
    const {
      oppName,
      oppDate,
      location,
      image,
      description,
      membershipRequired,
    } = req.body;

    const newOpp = new opportunityModel({
      oppName,
      oppDate,
      location,
      image,
      description,
      membershipRequired,
    });

    const savedOpp = await newOpp.save();

    // 🔁 Webhook to Membership Portal
    try {
      await axios.post(`${memUri}/webhook/opportunity`, {
        hrmsOppId: savedOpp._id.toString(),
        oppName,
        oppDate,
        location,
        image,
        description,
        membershipRequired,
      });
    } catch (webhookError) {
      console.error(
        "Webhook to membership portal failed:",
        webhookError.message
      );
    }

    res.status(201).json(savedOpp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
