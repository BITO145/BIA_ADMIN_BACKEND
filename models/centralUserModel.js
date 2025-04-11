// models/User.js
import mongoose from "mongoose";

const centralUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["superadmin", "subadmin"],
      default: "subadmin",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    allowedFeatures: {
      type: [
        {
          feature: { type: String, required: true },
          allowed: { type: Boolean, required: true },
        },
      ],
      default: [
        // Example default features (optional)
        { feature: "addEvent", allowed: true },
        { feature: "addChapter", allowed: true },
        // { feature: "addSubAdmin", allowed: true },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", centralUserSchema);
