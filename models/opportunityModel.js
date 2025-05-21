// models/Event.js
import mongoose from "mongoose";

const oppSchema = new mongoose.Schema(
  {
    oppName: {
      type: String,
      required: true,
      trim: true,
    },
    oppDate: {
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
    interestedMembers: [
      {
        memberId: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Opportunity", oppSchema);
