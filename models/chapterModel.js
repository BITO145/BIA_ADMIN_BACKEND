// models/Chapter.js
import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    chapterName: {
      type: String,
      required: true,
      trim: true,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    chapterLeadName: {
      type: String,
      required: true,
      trim: true,
    },
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    // Store only the membership IDs (as strings) to reference users in the membership portal
    members: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Chapter", chapterSchema);
