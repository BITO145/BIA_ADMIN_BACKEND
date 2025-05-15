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
    image: {
      type: String,
      required: true,
    },
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],

    members: [
      {
        memberId: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Chapter", chapterSchema);
