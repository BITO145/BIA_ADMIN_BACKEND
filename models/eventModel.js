// models/Event.js
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    eventStartTime: {
      type: Date,
      required: true,
    },
    eventEndTime: {
      type: Date,
      required: true,
    },
    // You can use eventDate separately if needed or use the eventStartTime's date component.
    eventDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    membershipRequired: {
      type: Boolean,
      default: false,
    },
    // Reference to the chapter the event belongs to
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
