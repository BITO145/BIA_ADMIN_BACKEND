import centralUserModel from "../models/centralUserModel.js";
import chapterModel from "../models/chapterModel.js";
import eventModel from "../models/eventModel.js";
import bcrypt from "bcrypt";
import {
  sendEventToWebhook,
  sendChapterToWebhook,
} from "../utils/webhookSender.js";

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

    // Create the chapter
    const newChapter = await chapterModel.create({
      chapterName,
      zone,
      description,
      chapterLeadName,
    });

    // Optionally, log newChapter if needed
    console.log("Chapter created:", newChapter);

    // Send webhook to membership portal
    // You might want to send only the fields needed on the membership side.
    await sendChapterToWebhook({
      hmrsChapterId: newChapter._id, // use a unique key for membership reference
      chapterName: newChapter.chapterName,
      zone: newChapter.zone,
      description: newChapter.description,
      chapterLeadName: newChapter.chapterLeadName,
      events: newChapter.events,
      createdAt: newChapter.createdAt,
    });

    res.status(201).json({
      message: "Chapter created successfully",
      chapter: newChapter,
    });
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
        error:
          "Please provide eventName, eventStartTime, eventEndTime, eventDate, location, and chapter.",
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
      chapter: chapterDoc._id, // ✅ send ObjectId
    });

    res
      .status(201)
      .json({ message: "Event created successfully", event: newEvent });
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
