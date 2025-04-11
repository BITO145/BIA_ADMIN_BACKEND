import centralUserModel from "../models/centralUserModel.js";
import chapterModel from "../models/chapterModel.js";
import eventModel from "../models/eventModel.js";
import bcrypt from "bcrypt";
//create a subadmin
// post event
//post chapter

export const createSubAdmin = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    // Check if the logged-in user is a superadmin
    if (req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({ error: "Only superadmins can create subadmins" });
    }

    // Check if user already exists with the same email or username
    const existingUser = await centralUserModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email or username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create subadmin
    const newSubAdmin = await centralUserModel.create({
      name,
      email,
      username,
      password: hashedPassword,
      role: "subadmin",
      createdBy: req.user.id, // assuming the JWT middleware sets req.user
    });

    res
      .status(201)
      .json({ message: "Subadmin created successfully", user: newSubAdmin });
  } catch (error) {
    console.error("Error creating subadmin:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const createChapter = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Authorization: allow superadmin or a subadmin with "addChapter" feature allowed
    if (
      req.user.role !== "superadmin" &&
      !req.user.allowedFeatures?.some(
        (feature) => feature.feature === "addChapter" && feature.allowed
      )
    ) {
      return res
        .status(403)
        .json({ error: "You do not have permission to create a chapter" });
    }

    // Validate required fields from the request body
    const { chapterName, zone, description, chapterLeadName } = req.body;
    if (!chapterName || !zone || !chapterLeadName) {
      return res.status(400).json({
        error: "chapterName, zone, and chapterLeadName are required fields",
      });
    }

    // Create a new chapter document
    const newChapter = await chapterModel.create({
      chapterName,
      zone,
      description,
      chapterLeadName,
    });

    res
      .status(201)
      .json({ message: "Chapter created successfully", chapter: newChapter });
  } catch (error) {
    console.error("Error creating chapter:", error);
    res.status(500).json({ error: "Server error" });
  }
};

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
      chapter, // chapter ID from the request body
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

    // Check if the chapter exists before proceeding
    const chapterDoc = await chapterModel.findById(chapter);
    if (!chapterDoc) {
      return res.status(404).json({ error: "Chapter not found." });
    }

    // Create the event document
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

    // Update the Chapter document to include the new event's ID
    await chapterModel.findByIdAndUpdate(
      chapter,
      { $push: { events: newEvent._id } },
      { new: true }
    );

    res
      .status(201)
      .json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Server error" });
  }
};
